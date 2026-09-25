/** Nombre y una línea: el ancla del hero en las variantes. */
export function Titulo() {
  return (
    <div className="mx-auto w-[560px] max-w-[calc(100%-32px)]">
      <h1 className="font-medium text-[clamp(28px,3.1vw,40px)] leading-[1.1] tracking-[-0.02em] text-enfasis">
        Valentín Márquez
      </h1>
      <p className="mt-3">
        Ingeniero de sistemas. Construyo cosas{" "}
        <span className="font-mano text-[1.45em] leading-none text-acento">con calma</span> y con
        cuidado.
      </p>
    </div>
  );
}
