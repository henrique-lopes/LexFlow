<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\LegalCase;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class DataJudController extends Controller
{
    private const API_URL = 'https://api-publica.datajud.cnj.jus.br';

    /**
     * Busca processo pelo número CNJ via DataJud.
     */
    public function searchByOAB(Request $request)
    {
        $request->validate([
            'cnj_number' => 'required|string|max:50',
            'tribunal'   => 'required|string|max:20',
        ]);

        $apiKey    = config('services.datajud.key');
        $digits    = preg_replace('/[^0-9]/', '', trim($request->cnj_number));
        $formatted = $this->formatCNJ($digits);
        $index     = $this->tribunalIndex($request->tribunal);

        // Busca pelo número formatado (term exato) e também pelos dígitos puros
        $response = Http::withHeaders([
            'Authorization' => "APIKey {$apiKey}",
            'Content-Type'  => 'application/json',
        ])->post(self::API_URL . "/api_publica_{$index}/_search", [
            'query' => [
                'bool' => [
                    'should' => [
                        ['term'  => ['numeroProcesso.keyword' => $formatted]],
                        ['match' => ['numeroProcesso' => $digits]],
                    ],
                    'minimum_should_match' => 1,
                ],
            ],
            'size' => 10,
            '_source' => [
                'numeroProcesso', 'classe', 'assuntos',
                'orgaoJulgador', 'tribunal', 'dataAjuizamento', 'grau',
            ],
        ]);

        if (!$response->successful()) {
            $status = $response->status();
            $body   = $response->json();
            $msg    = $body['error']['reason'] ?? "HTTP {$status}";
            return response()->json([
                'error' => "Erro ao consultar DataJud: {$msg}",
            ], 422);
        }

        $hits = $response->json('hits.hits', []);

        if (empty($hits)) {
            return response()->json(['cases' => [], 'message' => 'Nenhum processo encontrado para este número no tribunal selecionado.']);
        }

        $cases = collect($hits)->map(function ($hit) {
            $src = $hit['_source'];
            $filedAt = null;
            if (!empty($src['dataAjuizamento'])) {
                $ts = strtotime($src['dataAjuizamento']);
                $filedAt = $ts ? date('Y-m-d', $ts) : null;
            }
            return [
                'cnj_number' => $src['numeroProcesso'] ?? null,
                'title'      => $src['classe']['nome'] ?? 'Processo sem título',
                'tribunal'   => $src['tribunal'] ?? null,
                'court'      => $src['orgaoJulgador']['nome'] ?? null,
                'filed_at'   => $filedAt,
                'subject'    => collect($src['assuntos'] ?? [])->pluck('nome')->implode(', '),
            ];
        });

        return response()->json(['cases' => $cases]);
    }

    /**
     * Formata dígitos puros no padrão CNJ: NNNNNNN-DD.AAAA.J.TT.OOOO
     */
    private function formatCNJ(string $digits): string
    {
        $d = preg_replace('/\D/', '', $digits);
        if (strlen($d) !== 20) return $d;
        return sprintf(
            '%s-%s.%s.%s.%s.%s',
            substr($d,  0, 7),
            substr($d,  7, 2),
            substr($d,  9, 4),
            substr($d, 13, 1),
            substr($d, 14, 2),
            substr($d, 16, 4)
        );
    }

    /**
     * Importa um processo do DataJud para o workspace.
     */
    public function importCase(Request $request)
    {
        $request->validate([
            'cnj_number'      => 'required|string|max:30',
            'title'           => 'required|string|max:255',
            'tribunal'        => 'nullable|string|max:20',
            'court'           => 'nullable|string|max:255',
            'filed_at'        => 'nullable|date_format:Y-m-d',
            'client_id'       => 'nullable|exists:clients,id',
            'opposing_party'  => 'nullable|string|max:255',
        ]);

        $wsId      = $request->user()->current_workspace_id;
        $workspace = $request->user()->currentWorkspace;

        if (!$workspace) {
            return response()->json(['error' => 'Workspace não encontrado.'], 422);
        }

        if (!$workspace->canAddCase()) {
            return response()->json([
                'error' => "Limite de {$workspace->max_cases} processos atingido.",
            ], 422);
        }

        // Evita duplicata
        $exists = LegalCase::where('workspace_id', $wsId)
            ->where('cnj_number', $request->cnj_number)
            ->exists();

        if ($exists) {
            return response()->json(['error' => 'Este processo já foi importado.'], 422);
        }

        $case = LegalCase::create([
            'uuid'               => Str::uuid(),
            'workspace_id'       => $wsId,
            'client_id'          => $request->client_id,
            'responsible_user_id'=> $request->user()->id,
            'cnj_number'         => $request->cnj_number,
            'title'              => $request->title,
            'tribunal'           => $request->tribunal,
            'court'              => $request->court,
            'filed_at'           => $request->filed_at,
            'opposing_party'     => $request->opposing_party,
            'area'               => 'civil',
            'status'             => 'active',
            'side'               => 'author',
        ]);

        return response()->json([
            'message' => 'Processo importado com sucesso!',
            'uuid'    => $case->uuid,
        ]);
    }

    private function tribunalIndex(string $tribunal): string
    {
        return match(strtoupper($tribunal)) {
            // Justiça Estadual
            'TJSP'  => 'tjsp',
            'TJRJ'  => 'tjrj',
            'TJMG'  => 'tjmg',
            'TJRS'  => 'tjrs',
            'TJPR'  => 'tjpr',
            'TJSC'  => 'tjsc',
            'TJBA'  => 'tjba',
            'TJPE'  => 'tjpe',
            'TJCE'  => 'tjce',
            'TJGO'  => 'tjgo',
            'TJMT'  => 'tjmt',
            'TJMS'  => 'tjms',
            'TJPA'  => 'tjpa',
            'TJES'  => 'tjes',
            'TJAM'  => 'tjam',
            'TJMA'  => 'tjma',
            'TJPI'  => 'tjpi',
            'TJRN'  => 'tjrn',
            'TJAL'  => 'tjal',
            'TJSE'  => 'tjse',
            'TJPB'  => 'tjpb',
            'TJAC'  => 'tjac',
            'TJAP'  => 'tjap',
            'TJRR'  => 'tjrr',
            'TJRO'  => 'tjro',
            'TJTO'  => 'tjto',
            'TJDF'  => 'tjdft',
            // Justiça Federal
            'TRF1'  => 'trf1',
            'TRF2'  => 'trf2',
            'TRF3'  => 'trf3',
            'TRF4'  => 'trf4',
            'TRF5'  => 'trf5',
            'TRF6'  => 'trf6',
            // Justiça do Trabalho
            'TRT1'  => 'trt1',
            'TRT2'  => 'trt2',
            'TRT3'  => 'trt3',
            'TRT4'  => 'trt4',
            'TRT5'  => 'trt5',
            'TRT6'  => 'trt6',
            'TRT7'  => 'trt7',
            'TRT8'  => 'trt8',
            'TRT9'  => 'trt9',
            'TRT10' => 'trt10',
            'TRT11' => 'trt11',
            'TRT12' => 'trt12',
            'TRT13' => 'trt13',
            'TRT14' => 'trt14',
            'TRT15' => 'trt15',
            'TRT16' => 'trt16',
            'TRT17' => 'trt17',
            'TRT18' => 'trt18',
            'TRT19' => 'trt19',
            'TRT20' => 'trt20',
            'TRT21' => 'trt21',
            'TRT22' => 'trt22',
            'TRT23' => 'trt23',
            'TRT24' => 'trt24',
            // Superiores
            'TST'   => 'tst',
            'STJ'   => 'stj',
            'STF'   => 'stf',
            default => strtolower($tribunal),
        };
    }
}
