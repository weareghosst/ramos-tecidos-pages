export default function WhatsAppButton() {
  const phone = "5511974658040";
  const message = encodeURIComponent(
    "Olá! Vim pelo site Ramos Tecidos e gostaria de atendimento."
  );

  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition hover:scale-110"
    >
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-30" />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className="relative h-7 w-7 fill-current"
      >
        <path d="M19.11 17.21c-.29-.14-1.69-.83-1.95-.92-.26-.1-.45-.14-.64.14-.19.29-.73.92-.89 1.11-.17.19-.33.22-.62.07-.29-.14-1.21-.45-2.3-1.43-.85-.76-1.42-1.69-1.59-1.98-.17-.29-.02-.44.12-.58.13-.13.29-.33.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.64-1.55-.88-2.12-.23-.55-.47-.47-.64-.48h-.55c-.19 0-.5.07-.76.36-.26.29-1 1-.99 2.43 0 1.43 1.03 2.81 1.17 3 .14.19 2.02 3.08 4.89 4.31.68.29 1.21.46 1.62.58.68.22 1.3.19 1.79.12.55-.08 1.69-.69 1.93-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.33z" />
        <path d="M16.02 3.2C9 3.2 3.31 8.88 3.31 15.9c0 2.24.59 4.44 1.71 6.37L3.2 28.8l6.69-1.75c1.84 1 3.9 1.53 5.99 1.53h.01c7.01 0 12.7-5.69 12.7-12.7 0-3.39-1.32-6.57-3.72-8.97A12.6 12.6 0 0 0 16.02 3.2zm0 23.22h-.01a10.48 10.48 0 0 1-5.34-1.46l-.38-.23-3.97 1.04 1.06-3.87-.25-.4a10.54 10.54 0 0 1-1.62-5.6c0-5.81 4.72-10.53 10.53-10.53 2.81 0 5.46 1.09 7.44 3.09a10.45 10.45 0 0 1 3.08 7.44c0 5.81-4.72 10.52-10.54 10.52z" />
      </svg>
    </a>
  );
}