import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Button from '@/Components/UI/Button';
import { ChevronLeft } from 'lucide-react';

const areas = [
    ['trabalhista','Trabalhista'],['civil','Cível'],['empresarial','Empresarial'],
    ['familia','Família'],['tributario','Tributário'],['criminal','Criminal'],
    ['previdenciario','Previdenciário'],['administrativo','Administrativo'],
];
const feeTypes = [
    ['fixed','Honorário Fixo'],['success','Êxito'],['mixed','Misto (Fixo + Êxito)'],
    ['hourly','Por Hora'],['pro_bono','Pro Bono'],
];
const sides = [['author','Autor'],['defendant','Réu'],['third_party','Terceiro']];

function formatCurrency(raw) {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    const num = parseInt(digits, 10) / 100;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function parseCurrency(formatted) {
    return formatted.replace(/\./g, '').replace(',', '.');
}
const statuses = [
    ['active','Ativo'],['waiting','Aguardando'],['urgent','Urgente'],
    ['closed_won','Encerrado (Ganho)'],['closed_lost','Encerrado (Perdido)'],
];

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
function FInput({ ...props }) {
    return (
        <input className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5
            text-sm text-[#E8EAF0] placeholder-[#6B7491]
            focus:outline-none focus:border-[#C9A84C] transition-colors" {...props} />
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

export default function CasesEdit({ legalCase, clients, lawyers }) {
    const { data, setData, put, processing, errors } = useForm({
        title:               legalCase.title ?? '',
        client_id:           legalCase.client_id ? String(legalCase.client_id) : '',
        responsible_user_id: legalCase.responsible_user_id ? String(legalCase.responsible_user_id) : '',
        area:                legalCase.area ?? '',
        cnj_number:          legalCase.cnj_number ?? '',
        court:               legalCase.court ?? '',
        court_city:          legalCase.court_city ?? '',
        court_state:         legalCase.court_state ?? '',
        tribunal:            legalCase.tribunal ?? '',
        status:              legalCase.status ?? 'active',
        phase:               legalCase.phase ?? '',
        side:                legalCase.side ?? 'author',
        fee_type:            legalCase.fee_type ?? 'fixed',
        fee_amount:          legalCase.fee_amount ?? '',
        fee_success_pct:     legalCase.fee_success_pct ?? '',
        fee_payment_type:    legalCase.fee_payment_type ?? 'cash',
        fee_downpayment:     legalCase.fee_downpayment ?? '',
        fee_installments:    legalCase.fee_installments ?? [],
        case_value:          legalCase.case_value ?? '',
        filed_at:            legalCase.filed_at ?? '',
        next_deadline:       legalCase.next_deadline ?? '',
        notes:               legalCase.notes ?? '',
        opposing_party:      legalCase.opposing_party ?? '',
        opposing_lawyer:     legalCase.opposing_lawyer ?? '',
        opposing_oab:        legalCase.opposing_oab ?? '',
    });

    const [caseValueDisplay, setCaseValueDisplay] = useState(
        legalCase.case_value ? Number(legalCase.case_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''
    );
    const [feeAmountDisplay, setFeeAmountDisplay] = useState(
        legalCase.fee_amount ? Number(legalCase.fee_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''
    );
    const [feeDownpaymentDisplay, setFeeDownpaymentDisplay] = useState(
        legalCase.fee_downpayment ? Number(legalCase.fee_downpayment).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''
    );
    const [installmentDisplays, setInstallmentDisplays] = useState(
        (legalCase.fee_installments ?? []).map(i =>
            i.amount ? Number(i.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''
        )
    );

    function submit(e) {
        e.preventDefault();
        put(route('cases.update', legalCase.uuid));
    }

    return (
        <AppLayout title="Editar Processo">
            <Head title="Editar Processo — GertLex" />

            <div className="mb-6">
                <Link href={`/processos/${legalCase.uuid}`} className="inline-flex items-center gap-1 text-sm text-[#6B7491] hover:text-[#E8EAF0]">
                    <ChevronLeft size={16} /> Voltar
                </Link>
                <h1 className="text-xl font-bold text-[#E8EAF0] mt-2">Editar Processo</h1>
            </div>

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic info */}
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">Informações Básicas</h3>
                            <div className="space-y-4">
                                <Field label="Título do Processo" error={errors.title} required>
                                    <FInput value={data.title} onChange={e => setData('title', e.target.value)}
                                        placeholder="Ex: Ação Trabalhista — Horas Extras" />
                                </Field>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Cliente" error={errors.client_id} required>
                                        <FSelect value={data.client_id} onChange={e => setData('client_id', e.target.value)}>
                                            <option value="">Selecione...</option>
                                            {(clients ?? []).map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.company_name || c.name}
                                                </option>
                                            ))}
                                        </FSelect>
                                    </Field>

                                    <Field label="Advogado Responsável" error={errors.responsible_user_id} required>
                                        <FSelect value={data.responsible_user_id} onChange={e => setData('responsible_user_id', e.target.value)}>
                                            <option value="">Selecione...</option>
                                            {(lawyers ?? []).map(l => (
                                                <option key={l.id} value={l.id}>{l.name}</option>
                                            ))}
                                        </FSelect>
                                    </Field>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <Field label="Área" error={errors.area} required>
                                        <FSelect value={data.area} onChange={e => setData('area', e.target.value)}>
                                            <option value="">Selecione...</option>
                                            {areas.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                                        </FSelect>
                                    </Field>

                                    <Field label="Status">
                                        <FSelect value={data.status} onChange={e => setData('status', e.target.value)}>
                                            {statuses.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                                        </FSelect>
                                    </Field>

                                    <Field label="Polo">
                                        <FSelect value={data.side} onChange={e => setData('side', e.target.value)}>
                                            {sides.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                                        </FSelect>
                                    </Field>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Nº CNJ">
                                        <FInput value={data.cnj_number}
                                            onChange={e => setData('cnj_number', e.target.value)}
                                            placeholder="0000000-00.0000.0.00.0000" />
                                    </Field>
                                    <Field label="Fase Processual">
                                        <FInput value={data.phase}
                                            onChange={e => setData('phase', e.target.value)}
                                            placeholder="Ex: Instrução, Recurso..." />
                                    </Field>
                                </div>
                            </div>
                        </div>

                        {/* Court info */}
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">Dados do Tribunal</h3>
                            <div className="space-y-4">
                                <Field label="Vara / Juízo">
                                    <FInput value={data.court} onChange={e => setData('court', e.target.value)}
                                        placeholder="Ex: 2ª Vara do Trabalho" />
                                </Field>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <Field label="Cidade">
                                            <FInput value={data.court_city} onChange={e => setData('court_city', e.target.value)} />
                                        </Field>
                                    </div>
                                    <Field label="Estado">
                                        <FInput value={data.court_state} onChange={e => setData('court_state', e.target.value)}
                                            placeholder="SP" maxLength={2} />
                                    </Field>
                                </div>
                                <Field label="Tribunal">
                                    <FInput value={data.tribunal} onChange={e => setData('tribunal', e.target.value)}
                                        placeholder="TJSP, TRT2, STJ..." />
                                </Field>
                            </div>
                        </div>

                        {/* Opposing party */}
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">Parte Contrária</h3>
                            <div className="space-y-4">
                                <Field label="Nome da Parte Contrária">
                                    <FInput value={data.opposing_party}
                                        onChange={e => setData('opposing_party', e.target.value)}
                                        placeholder="Nome do réu ou autor contrário" />
                                </Field>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Advogado Contrário">
                                        <FInput value={data.opposing_lawyer}
                                            onChange={e => setData('opposing_lawyer', e.target.value)}
                                            placeholder="Dr. Nome do Advogado" />
                                    </Field>
                                    <Field label="OAB do Advogado Contrário">
                                        <FInput value={data.opposing_oab}
                                            onChange={e => setData('opposing_oab', e.target.value)}
                                            placeholder="SP 123456" />
                                    </Field>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">Observações</h3>
                            <textarea
                                value={data.notes}
                                onChange={e => setData('notes', e.target.value)}
                                rows={4}
                                placeholder="Notas internas sobre o processo..."
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5
                                    text-sm text-[#E8EAF0] placeholder-[#6B7491]
                                    focus:outline-none focus:border-[#C9A84C] transition-colors resize-none"
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">Datas</h3>
                            <div className="space-y-4">
                                <Field label="Data de Distribuição">
                                    <FInput type="date" value={data.filed_at} onChange={e => setData('filed_at', e.target.value)} />
                                </Field>
                                <Field label="Próximo Prazo">
                                    <FInput type="date" value={data.next_deadline} onChange={e => setData('next_deadline', e.target.value)} />
                                </Field>
                            </div>
                        </div>

                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">Honorários</h3>
                            <div className="space-y-4">
                                <Field label="Tipo de Honorário">
                                    <FSelect value={data.fee_type} onChange={e => setData('fee_type', e.target.value)}>
                                        {feeTypes.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                                    </FSelect>
                                </Field>
                                {['fixed','mixed'].includes(data.fee_type) && (
                                    <Field label="Valor Fixo (R$)">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6B7491]">R$</span>
                                            <FInput
                                                type="text"
                                                inputMode="numeric"
                                                value={feeAmountDisplay}
                                                onChange={e => {
                                                    const fmt = formatCurrency(e.target.value);
                                                    setFeeAmountDisplay(fmt);
                                                    setData('fee_amount', parseCurrency(fmt));
                                                }}
                                                placeholder="0,00"
                                                className="pl-9"
                                            />
                                        </div>
                                    </Field>
                                )}
                                {['success','mixed'].includes(data.fee_type) && (
                                    <Field label="% de Êxito">
                                        <FInput type="number" step="0.01" min="0" max="100" value={data.fee_success_pct}
                                            onChange={e => setData('fee_success_pct', e.target.value)} placeholder="20" />
                                    </Field>
                                )}
                                <Field label="Valor da Causa (R$)">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6B7491]">R$</span>
                                        <FInput
                                            type="text"
                                            inputMode="numeric"
                                            value={caseValueDisplay}
                                            onChange={e => {
                                                const fmt = formatCurrency(e.target.value);
                                                setCaseValueDisplay(fmt);
                                                setData('case_value', parseCurrency(fmt));
                                            }}
                                            placeholder="0,00"
                                            className="pl-9"
                                        />
                                    </div>
                                </Field>

                                {/* Forma de Pagamento */}
                                <div className="border-t border-[#1E2330] pt-4">
                                    <p className="text-xs font-semibold text-[#6B7491] uppercase tracking-wider mb-3">Forma de Pagamento</p>
                                    <div className="flex gap-3 mb-4">
                                        {[['cash','À Vista'],['installment','Parcelado']].map(([v,l]) => (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() => setData('fee_payment_type', v)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                                    data.fee_payment_type === v
                                                        ? 'bg-[#C9A84C] border-[#C9A84C] text-[#0D0F14]'
                                                        : 'border-[#1E2330] text-[#6B7491] hover:border-[#C9A84C] hover:text-[#C9A84C]'
                                                }`}
                                            >{l}</button>
                                        ))}
                                    </div>

                                    {data.fee_payment_type === 'installment' && (
                                        <div className="space-y-3">
                                            <Field label="Entrada (R$)">
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6B7491]">R$</span>
                                                    <FInput
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={feeDownpaymentDisplay}
                                                        onChange={e => {
                                                            const fmt = formatCurrency(e.target.value);
                                                            setFeeDownpaymentDisplay(fmt);
                                                            setData('fee_downpayment', parseCurrency(fmt));
                                                        }}
                                                        placeholder="0,00"
                                                        className="pl-9"
                                                    />
                                                </div>
                                            </Field>

                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-medium text-[#6B7491] uppercase tracking-wider">Parcelas</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setData('fee_installments', [...data.fee_installments, { amount: '', due_date: '', paid: false }]);
                                                            setInstallmentDisplays(prev => [...prev, '']);
                                                        }}
                                                        className="text-xs text-[#C9A84C] hover:text-[#E8C95D] font-medium"
                                                    >+ Adicionar parcela</button>
                                                </div>

                                                {data.fee_installments.length === 0 && (
                                                    <p className="text-xs text-[#6B7491] text-center py-3">Nenhuma parcela adicionada.</p>
                                                )}

                                                <div className="space-y-2">
                                                    {data.fee_installments.map((inst, idx) => (
                                                        <div key={idx} className="flex gap-2 items-center bg-[#0D0F14] border border-[#1E2330] rounded-lg px-3 py-2">
                                                            <span className="text-xs text-[#6B7491] w-5 shrink-0">{idx + 1}.</span>
                                                            <div className="relative flex-1">
                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#6B7491]">R$</span>
                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    value={installmentDisplays[idx] ?? ''}
                                                                    onChange={e => {
                                                                        const fmt = formatCurrency(e.target.value);
                                                                        const newDisplays = [...installmentDisplays];
                                                                        newDisplays[idx] = fmt;
                                                                        setInstallmentDisplays(newDisplays);
                                                                        const newInst = [...data.fee_installments];
                                                                        newInst[idx] = { ...newInst[idx], amount: parseCurrency(fmt) };
                                                                        setData('fee_installments', newInst);
                                                                    }}
                                                                    placeholder="0,00"
                                                                    className="w-full bg-transparent pl-7 text-sm text-[#E8EAF0] placeholder-[#6B7491] focus:outline-none"
                                                                />
                                                            </div>
                                                            <input
                                                                type="date"
                                                                value={inst.due_date ?? ''}
                                                                onChange={e => {
                                                                    const newInst = [...data.fee_installments];
                                                                    newInst[idx] = { ...newInst[idx], due_date: e.target.value };
                                                                    setData('fee_installments', newInst);
                                                                }}
                                                                className="bg-transparent text-sm text-[#E8EAF0] focus:outline-none w-36 shrink-0"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newInst = [...data.fee_installments];
                                                                    newInst[idx] = { ...newInst[idx], paid: !newInst[idx].paid };
                                                                    setData('fee_installments', newInst);
                                                                }}
                                                                className={`text-xs px-2 py-1 rounded shrink-0 ${inst.paid ? 'bg-green-900/40 text-green-400' : 'bg-[#1E2330] text-[#6B7491]'}`}
                                                            >{inst.paid ? 'Pago' : 'Pendente'}</button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setData('fee_installments', data.fee_installments.filter((_, i) => i !== idx));
                                                                    setInstallmentDisplays(prev => prev.filter((_, i) => i !== idx));
                                                                }}
                                                                className="text-[#E05555] hover:text-red-400 text-xs shrink-0"
                                                            >✕</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button type="submit" disabled={processing} size="lg" className="w-full justify-center">
                                {processing ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                            <Link href={`/processos/${legalCase.uuid}`}>
                                <Button variant="secondary" size="lg" className="w-full justify-center">Cancelar</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
