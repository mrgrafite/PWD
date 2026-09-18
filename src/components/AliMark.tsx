// Símbolo da marca ALI Tecnologia: duas curvas ascendentes que se aproximam
// e se encaixam sem se fechar por completo — uma é o cliente, a outra é a
// ALI. Ponto de encontro em Terracotta, única cor quente do símbolo.
// Ref.: reference_ali_identidade_visual (paleta oficial).
interface AliMarkProps {
  size?: number;
  strokeA?: string;
  strokeB?: string;
  dot?: string;
  className?: string;
}

export default function AliMark({
  size = 34,
  strokeA = "#F2EEE5",
  strokeB = "#B78A61",
  dot = "#9A6048",
  className,
}: AliMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" className={className}>
      <path d="M4 26C10 26 12 20 18 16C22 13 24 9 24 5" stroke={strokeA} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M30 8C24 8 22 14 16 18C12 21 10 25 10 29" stroke={strokeB} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="17" cy="17" r="2.4" fill={dot} />
    </svg>
  );
}
