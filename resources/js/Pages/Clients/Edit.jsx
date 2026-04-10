import { useState, useRef } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Button from '@/Components/UI/Button';
import { ChevronLeft, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

function ProcuracaoUpload({ onExtracted }) {
    const [state, setState] = useState('idle');
    const [msg, setMsg]     = useState('');
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef();

    async function process(file) {
        if (!file) return;
        setState('loading');
        setMsg('');
        const form = new FormData();
        form.append('file', file);
        form.append('_token', document.querySelector('meta[name="csrf-token"]')?.content);
        try {
            const res  = await fetch('/clientes/extrair-procuracao', { method: 'POST', body: form });
            const json = await res.json();
            if (!res.ok) { setState('error'); setMsg(json.error ?? 'Erro ao processar.'); return; }
            setState('success');
            setMsg('Dados extraídos! Confirme as informações abaixo.');
            onExtracted(json.data);
        } catch {
            setState('error');
            setMsg('Erro de conexão.');
        }
    }

    return (
        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#E8EAF0] mb-1">Importar via Procuração</h3>
            <p className="text-xs text-[#6B7491] mb-4">Faça upload da procuração (PDF ou imagem) e a IA preencherá os dados automaticamente.</p>
            <div
                onClick={() => state !== 'loading' && inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); process(e.dataTransfer.files[0]); }}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors
                    ${state === 'loading' ? 'opacity-60 cursor-not-allowed' : 'hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/5'}
                    ${dragging ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-[#1E2330]'}
                    ${state === 'success' ? 'border-[#2ECC8A]/40 bg-[#2ECC8A]/5' : ''}
                    ${state === 'error'   ? 'border-[#E05555]/40 bg-[#E05555]/5'  : ''}`}
            >
                {state === 'loading' ? (
                    <><Loader2 size={24} className="text-[#C9A84C] animate-spin" /><p className="text-sm text-[#6B7491]">Processando com IA...</p></>
                ) : state === 'success' ? (
                    <><CheckCircle size={24} className="text-[#2ECC8A]" /><p className="text-sm text-[#2ECC8A]">{msg}</p></>
                ) : state === 'error' ? (
                    <><AlertCircle size={24} className="text-[#E05555]" /><p className="text-sm text-[#E05555]">{msg}</p><p className="text-xs text-[#6B7491]">Clique para tentar novamente</p></>
                ) : (
                    <><Upload size={24} className="text-[#6B7491]" /><p className="text-sm text-[#6B7491]">Arraste ou clique para selecionar</p><p className="text-xs text-[#6B7491]">PDF, JPG ou PNG — máx. 10MB</p></>
                )}
            </div>
            <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                onChange={e => process(e.target.files[0])} />
        </div>
    );
}

function formatCPF(v) {
    return v.replace(/\D/g, '').slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}
function formatCNPJ(v) {
    return v.replace(/\D/g, '').slice(0, 14)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function FInput({ ...props }) {
    return (
        <input className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5
            text-sm text-[#E8EAF0] placeholder-[#6B7491] focus:outline-none focus:border-[#C9A84C] transition-colors"
            {...props} />
    );
}
function FSelect({ children, ...props }) {
    return (
        <select className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5
            text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C] transition-colors" {...props}>
            {children}
        </select>
    );
}
function Field({ label, error, required, children }) {
    return (
        <div>
            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">
                {label}{required && <span className="text-[#E05555] ml-0.5">*</span>}
            </label>
            {children}
            {error && <p className="text-xs text-[#E05555] mt-1">{error}</p>}
        </div>
    );
}

export default function ClientsEdit({ client, lawyers }) {
    const { data, setData, put, processing, errors } = useForm({
        name:                 client.name ?? '',
        email:                client.email ?? '',
        phone:                client.phone ?? '',
        cpf:                  client.cpf ?? '',
        rg:                   client.rg ?? '',
        nationality:          client.nationality ?? 'Brasileira',
        marital_status:       client.marital_status ?? '',
        profession:           client.profession ?? '',
        cnpj:                 client.cnpj ?? '',
        company_name:         client.company_name ?? '',
        trade_name:           client.trade_name ?? '',
        responsible_user_id:  client.responsible_user_id ? String(client.responsible_user_id) : '',
        address_street:       client.address_street ?? '',
        address_number:       client.address_number ?? '',
        address_complement:   client.address_complement ?? '',
        address_neighborhood: client.address_neighborhood ?? '',
        address_city:         client.address_city ?? '',
        address_state:        client.address_state ?? '',
        address_zipcode:      client.address_zipcode ?? '',
        status:               client.status ?? 'active',
        notes:                client.notes ?? '',
    });

    function handleExtracted(extracted) {
        setData(d => ({
            ...d,
            name:                 extracted.name                ?? d.name,
            nationality:          extracted.nationality         ?? d.nationality,
            marital_status:       extracted.marital_status      ?? d.marital_status,
            profession:           extracted.profession          ?? d.profession,
            rg:                   extracted.rg                  ?? d.rg,
            cpf:                  extracted.cpf                 ?? d.cpf,
            email:                extracted.email               ?? d.email,
            phone:                extracted.phone               ?? d.phone,
            address_street:       extracted.address_street       ?? d.address_street,
            address_number:       extracted.address_number       ?? d.address_number,
            address_complement:   extracted.address_complement   ?? d.address_complement,
            address_neighborhood: extracted.address_neighborhood ?? d.address_neighborhood,
            address_city:         extracted.address_city         ?? d.address_city,
            address_state:        extracted.address_state        ?? d.address_state,
            address_zipcode:      extracted.address_zipcode      ?? d.address_zipcode,
        }));
    }

    async function fetchCEP() {
        const cep = data.address_zipcode.replace(/\D/g, '');
        if (cep.length !== 8) return;
        try {
            const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const json = await r.json();
            if (!json.erro) {
                setData(d => ({
                    ...d,
                    address_street:       json.logradouro || d.address_street,
                    address_neighborhood: json.bairro || d.address_neighborhood,
                    address_city:         json.localidade || d.address_city,
                    address_state:        json.uf || d.address_state,
                }));
            }
        } catch {}
    }

    function submit(e) {
        e.preventDefault();
        put(route('clients.update', client.uuid));
    }

    const isCompany = client.type === 'company';

    return (
        <AppLayout title="Editar Cliente">
            <Head title="Editar Cliente — GertLex" />

            <div className="mb-6">
                <Link href={`/clientes/${client.uuid}`} className="inline-flex items-center gap-1 text-sm text-[#6B7491] hover:text-[#E8EAF0]">
                    <ChevronLeft size={16} /> Voltar
                </Link>
                <h1 className="text-xl font-bold text-[#E8EAF0] mt-2">
                    Editar: {client.company_name || client.name}
                </h1>
            </div>

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Procuração IA */}
                        <ProcuracaoUpload onExtracted={handleExtracted} />

                        {/* Personal / company info */}
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">
                                {isCompany ? 'Dados da Empresa' : 'Dados Pessoais'}
                            </h3>
                            <div className="space-y-4">
                                {isCompany ? (
                                    <>
                                        <Field label="CNPJ" error={errors.cnpj}>
                                            <FInput value={data.cnpj}
                                                onChange={e => setData('cnpj', formatCNPJ(e.target.value))}
                                                placeholder="00.000.000/0001-00" />
                                        </Field>
                                        <Field label="Razão Social" error={errors.company_name} required>
                                            <FInput value={data.company_name} onChange={e => setData('company_name', e.target.value)} />
                                        </Field>
                                        <Field label="Nome Fantasia">
                                            <FInput value={data.trade_name} onChange={e => setData('trade_name', e.target.value)} />
                                        </Field>
                                    </>
                                ) : (
                                    <>
                                        <Field label="Nome Completo" error={errors.name} required>
                                            <FInput value={data.name} onChange={e => setData('name', e.target.value)} />
                                        </Field>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="CPF" error={errors.cpf}>
                                                <FInput value={data.cpf}
                                                    onChange={e => setData('cpf', formatCPF(e.target.value))}
                                                    placeholder="000.000.000-00" />
                                            </Field>
                                            <Field label="RG">
                                                <FInput value={data.rg} onChange={e => setData('rg', e.target.value)}
                                                    placeholder="00.000.000-0" />
                                            </Field>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <Field label="Nacionalidade">
                                                <FInput value={data.nationality} onChange={e => setData('nationality', e.target.value)}
                                                    placeholder="Brasileira" />
                                            </Field>
                                            <Field label="Estado Civil">
                                                <FSelect value={data.marital_status} onChange={e => setData('marital_status', e.target.value)}>
                                                    <option value="">Selecione...</option>
                                                    <option value="solteiro">Solteiro(a)</option>
                                                    <option value="casado">Casado(a)</option>
                                                    <option value="divorciado">Divorciado(a)</option>
                                                    <option value="viuvo">Viúvo(a)</option>
                                                    <option value="uniao_estavel">União Estável</option>
                                                </FSelect>
                                            </Field>
                                            <Field label="Profissão">
                                                <FInput value={data.profession} onChange={e => setData('profession', e.target.value)}
                                                    placeholder="Ex: Comerciante" />
                                            </Field>
                                        </div>
                                    </>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="E-mail" error={errors.email}>
                                        <FInput type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                            placeholder="email@exemplo.com" />
                                    </Field>
                                    <Field label="Telefone">
                                        <FInput value={data.phone} onChange={e => setData('phone', e.target.value)}
                                            placeholder="(11) 99999-0000" />
                                    </Field>
                                </div>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">Endereço</h3>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <Field label="CEP">
                                            <FInput value={data.address_zipcode} onChange={e => setData('address_zipcode', e.target.value)}
                                                placeholder="00000-000" onBlur={fetchCEP} />
                                        </Field>
                                    </div>
                                    <div className="flex items-end pb-0.5">
                                        <button type="button" onClick={fetchCEP}
                                            className="px-3 py-2.5 bg-[#C9A84C]/15 text-[#C9A84C] text-xs rounded-lg hover:bg-[#C9A84C]/25 transition-colors">
                                            Buscar CEP
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="col-span-3">
                                        <Field label="Logradouro">
                                            <FInput value={data.address_street} onChange={e => setData('address_street', e.target.value)} />
                                        </Field>
                                    </div>
                                    <Field label="Número">
                                        <FInput value={data.address_number} onChange={e => setData('address_number', e.target.value)} />
                                    </Field>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <Field label="Bairro">
                                        <FInput value={data.address_neighborhood} onChange={e => setData('address_neighborhood', e.target.value)} />
                                    </Field>
                                    <Field label="Cidade">
                                        <FInput value={data.address_city} onChange={e => setData('address_city', e.target.value)} />
                                    </Field>
                                    <Field label="Estado">
                                        <FInput value={data.address_state} onChange={e => setData('address_state', e.target.value)} maxLength={2} />
                                    </Field>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">Configurações</h3>
                            <div className="space-y-4">
                                <Field label="Status">
                                    <FSelect value={data.status} onChange={e => setData('status', e.target.value)}>
                                        <option value="active">Ativo</option>
                                        <option value="inactive">Inativo</option>
                                        <option value="suspended">Suspenso</option>
                                    </FSelect>
                                </Field>
                                <Field label="Advogado Responsável">
                                    <FSelect value={data.responsible_user_id} onChange={e => setData('responsible_user_id', e.target.value)}>
                                        <option value="">Selecione...</option>
                                        {(lawyers ?? []).map(l => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </FSelect>
                                </Field>
                            </div>
                        </div>

                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">Observações</h3>
                            <textarea value={data.notes} onChange={e => setData('notes', e.target.value)} rows={4}
                                placeholder="Notas sobre o cliente..."
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5
                                    text-sm text-[#E8EAF0] placeholder-[#6B7491] focus:outline-none focus:border-[#C9A84C] resize-none" />
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button type="submit" disabled={processing} size="lg" className="w-full justify-center">
                                {processing ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                            <Link href={`/clientes/${client.uuid}`}>
                                <Button variant="secondary" size="lg" className="w-full justify-center">Cancelar</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
