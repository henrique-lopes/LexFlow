<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\WorkspaceMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ClientWebController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return $request->user()->current_workspace_id;
    }

    public function index(Request $request)
    {
        $wsId = $this->workspaceId($request);

        $query = Client::where('workspace_id', $wsId)
            ->with('responsible:id,name');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('cpf', 'like', "%{$search}%")
                  ->orWhere('cnpj', 'like', "%{$search}%");
            });
        }
        if ($type = $request->get('type')) {
            $query->where('type', $type);
        }
        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $clients = $query->withCount('cases')->latest()->paginate(15)->withQueryString();

        return Inertia::render('Clients/Index', [
            'clients' => $clients,
            'filters' => $request->only(['search', 'type', 'status']),
        ]);
    }

    public function create(Request $request)
    {
        $wsId = $this->workspaceId($request);

        $lawyers = WorkspaceMember::where('workspace_id', $wsId)
            ->where('is_active', true)
            ->with('user:id,name')
            ->get()
            ->map(fn($m) => ['id' => $m->user_id, 'name' => $m->user->name ?? '']);

        return Inertia::render('Clients/Create', [
            'lawyers' => $lawyers,
        ]);
    }

    public function store(Request $request)
    {
        $wsId = $this->workspaceId($request);

        $data = $request->validate([
            'type'                => 'required|in:individual,company',
            'name'                => 'nullable|string|max:255',
            'email'               => 'nullable|email|max:255',
            'phone'               => 'nullable|string|max:20',
            'cpf'                 => 'nullable|string|max:14',
            'rg'                  => 'nullable|string|max:20',
            'nationality'         => 'nullable|string|max:50',
            'marital_status'      => 'nullable|string|max:30',
            'profession'          => 'nullable|string|max:100',
            'cnpj'                => 'nullable|string|max:18',
            'company_name'        => 'nullable|string|max:255',
            'trade_name'          => 'nullable|string|max:255',
            'responsible_user_id' => 'nullable|exists:users,id',
            'address_street'      => 'nullable|string|max:255',
            'address_number'      => 'nullable|string|max:20',
            'address_complement'  => 'nullable|string|max:100',
            'address_neighborhood'=> 'nullable|string|max:100',
            'address_city'        => 'nullable|string|max:100',
            'address_state'       => 'nullable|string|max:2',
            'address_zipcode'     => 'nullable|string|max:10',
            'notes'               => 'nullable|string',
            'origin'              => 'nullable|string|max:50',
        ]);

        // Para PJ, o campo `name` é preenchido automaticamente com a razão social
        if ($data['type'] === 'company' && empty($data['name'])) {
            $data['name'] = $data['company_name'] ?? $data['trade_name'] ?? 'Empresa';
        }

        $client = Client::create([
            ...$data,
            'uuid'                => Str::uuid(),
            'workspace_id'        => $wsId,
            'responsible_user_id' => $data['responsible_user_id'] ?? $request->user()->id,
            'status'              => 'active',
            'portal_token'        => Str::random(32),
            'client_since'        => now()->toDateString(),
        ]);

        return redirect()->route('clients.show', $client->uuid)
            ->with('success', 'Cliente cadastrado com sucesso!');
    }

    public function show(Request $request, string $uuid)
    {
        $wsId = $this->workspaceId($request);

        $client = Client::where('workspace_id', $wsId)
            ->where('uuid', $uuid)
            ->with([
                'responsible:id,name',
                'cases:id,uuid,title,area,status,phase,case_value,responsible_user_id',
                'invoices' => fn($q) => $q->latest()->take(10),
            ])
            ->firstOrFail();

        return Inertia::render('Clients/Show', [
            'client' => $client,
        ]);
    }

    public function edit(Request $request, string $uuid)
    {
        $wsId = $this->workspaceId($request);
        $client = Client::where('workspace_id', $wsId)->where('uuid', $uuid)->firstOrFail();
        $lawyers = WorkspaceMember::where('workspace_id', $wsId)
            ->where('is_active', true)
            ->with('user:id,name')
            ->get()
            ->map(fn($m) => ['id' => $m->user_id, 'name' => $m->user->name ?? '']);

        return Inertia::render('Clients/Edit', [
            'client'  => $client,
            'lawyers' => $lawyers,
        ]);
    }

    public function update(Request $request, string $uuid)
    {
        $wsId = $this->workspaceId($request);
        $client = Client::where('workspace_id', $wsId)->where('uuid', $uuid)->firstOrFail();

        $data = $request->validate([
            'name'                => 'nullable|string|max:255',
            'email'               => 'nullable|email|max:255',
            'phone'               => 'nullable|string|max:20',
            'cpf'                 => 'nullable|string|max:14',
            'rg'                  => 'nullable|string|max:20',
            'nationality'         => 'nullable|string|max:50',
            'marital_status'      => 'nullable|string|max:30',
            'profession'          => 'nullable|string|max:100',
            'cnpj'                => 'nullable|string|max:18',
            'company_name'        => 'nullable|string|max:255',
            'trade_name'          => 'nullable|string|max:255',
            'responsible_user_id' => 'nullable|exists:users,id',
            'address_street'      => 'nullable|string|max:255',
            'address_number'      => 'nullable|string|max:20',
            'address_complement'  => 'nullable|string|max:100',
            'address_neighborhood'=> 'nullable|string|max:100',
            'address_city'        => 'nullable|string|max:100',
            'address_state'       => 'nullable|string|max:2',
            'address_zipcode'     => 'nullable|string|max:10',
            'status'              => 'nullable|in:active,inactive,suspended',
            'notes'               => 'nullable|string',
        ]);

        // Para PJ, sincroniza o campo `name` com a razão social se vazio
        if ($client->type === 'company' && empty($data['name'])) {
            $data['name'] = $data['company_name'] ?? $data['trade_name'] ?? $client->name;
        }

        $client->update($data);

        return redirect()->route('clients.show', $client->uuid)
            ->with('success', 'Cliente atualizado com sucesso!');
    }

    public function extractFromProcuracao(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $apiKey = config('services.anthropic.key');
        if (!$apiKey) {
            return response()->json(['error' => 'API da IA não configurada.'], 503);
        }

        $file     = $request->file('file');
        $mime     = $file->getMimeType();
        $base64   = base64_encode(file_get_contents($file->getRealPath()));

        // Monta o bloco de conteúdo conforme o tipo
        if ($mime === 'application/pdf') {
            $contentBlock = [
                'type'   => 'document',
                'source' => [
                    'type'       => 'base64',
                    'media_type' => 'application/pdf',
                    'data'       => $base64,
                ],
            ];
        } else {
            $contentBlock = [
                'type'   => 'image',
                'source' => [
                    'type'       => 'base64',
                    'media_type' => $mime,
                    'data'       => $base64,
                ],
            ];
        }

        $prompt = <<<EOT
Analise este documento (procuração ou contrato) e extraia os dados do OUTORGANTE (cliente).
Retorne APENAS um JSON válido com os seguintes campos (use null quando não encontrar):
{
  "name": "nome completo",
  "nationality": "nacionalidade",
  "marital_status": "solteiro|casado|divorciado|viuvo|uniao_estavel ou null",
  "profession": "profissão",
  "rg": "número do RG",
  "cpf": "CPF formatado como 000.000.000-00",
  "email": "e-mail ou null",
  "phone": "telefone ou null",
  "address_street": "logradouro",
  "address_number": "número",
  "address_complement": "complemento ou null",
  "address_neighborhood": "bairro",
  "address_city": "cidade",
  "address_state": "UF com 2 letras",
  "address_zipcode": "CEP somente números"
}
Retorne somente o JSON, sem texto adicional.
EOT;

        $response = Http::withHeaders([
            'x-api-key'         => $apiKey,
            'anthropic-version' => '2023-06-01',
            'anthropic-beta'    => 'pdfs-2024-09-25',
            'content-type'      => 'application/json',
        ])->timeout(30)->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 1024,
            'messages'   => [[
                'role'    => 'user',
                'content' => [
                    $contentBlock,
                    ['type' => 'text', 'text' => $prompt],
                ],
            ]],
        ]);

        if ($response->failed()) {
            return response()->json(['error' => 'Erro ao processar o documento com IA.'], 500);
        }

        $text = $response->json('content.0.text', '');

        // Extrai o JSON da resposta
        preg_match('/\{.*\}/s', $text, $matches);
        if (empty($matches)) {
            return response()->json(['error' => 'Não foi possível extrair os dados do documento.'], 422);
        }

        $extracted = json_decode($matches[0], true);
        if (!$extracted) {
            return response()->json(['error' => 'Resposta inválida da IA.'], 422);
        }

        return response()->json(['data' => $extracted]);
    }

    public function destroy(Request $request, string $uuid)
    {
        $wsId = $this->workspaceId($request);
        $client = Client::where('workspace_id', $wsId)->where('uuid', $uuid)->firstOrFail();
        $client->delete();

        return redirect()->route('clients.index')
            ->with('success', 'Cliente removido com sucesso!');
    }
}
