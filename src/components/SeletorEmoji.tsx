import EmojiPicker, { Theme } from "emoji-picker-react";

// Isolado num arquivo próprio pra ser carregado sob demanda (lazy) — a
// biblioteca sozinha dobra o tamanho do bundle, e só é usada quando o
// atendente abre o seletor no chat.
export default function SeletorEmoji({ onSelecionar }: { onSelecionar: (emoji: string) => void }) {
  return (
    <EmojiPicker
      onEmojiClick={(e) => onSelecionar(e.emoji)}
      theme={Theme.AUTO}
      width="100%"
      height={320}
      searchPlaceHolder="Buscar emoji..."
      previewConfig={{ showPreview: false }}
      lazyLoadEmojis
    />
  );
}
