import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Imagem Open Graph (1200 × 630) no estilo do site: fundo escuro, cantoneiras
// de HUD, telemetria em mono e o título em Archivo. Gerada no build.
export const tamanho = { width: 1200, height: 630 };

const pasta = join(process.cwd(), "src/app/_og");

export async function imagemOg({ rotulo, titulo, frase }: { rotulo: string; titulo: string; frase: string }) {
  const [archivo, mono] = await Promise.all([
    readFile(join(pasta, "archivo-112-800.ttf")),
    readFile(join(pasta, "jetbrains-mono-500.ttf")),
  ]);
  const canto = (pos: Record<string, number>, bordas: Record<string, string>) => (
    <div style={{ position: "absolute", width: 44, height: 44, ...pos, ...bordas }} />
  );
  const linha = "3px solid #6F98A6";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#0E1113",
          color: "#ECEDEA",
          position: "relative",
        }}
      >
        {canto({ top: 32, left: 32 }, { borderTop: linha, borderLeft: linha })}
        {canto({ top: 32, right: 32 }, { borderTop: linha, borderRight: linha })}
        {canto({ bottom: 32, left: 32 }, { borderBottom: linha, borderLeft: linha })}
        {canto({ bottom: 32, right: 32 }, { borderBottom: linha, borderRight: linha })}
        <div style={{ display: "flex", fontFamily: "Mono", fontSize: 22, letterSpacing: 3, lineHeight: 1.45, color: "#93B7C3" }}>
          <div style={{ display: "flex", flexShrink: 0, color: "#FF7A2E", marginRight: 16 }}>&gt;&gt;&gt;</div>
          <div style={{ display: "flex", flex: 1 }}>{rotulo.toUpperCase()}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "Archivo", fontSize: titulo.length > 28 ? 76 : 104, lineHeight: 1, letterSpacing: -2 }}>
            {titulo}
          </div>
          <div style={{ marginTop: 28, fontFamily: "Archivo", fontSize: 38, lineHeight: 1.2, color: "#C9CED2" }}>{frase}</div>
        </div>
        <div style={{ display: "flex", fontFamily: "Mono", fontSize: 22, letterSpacing: 2, color: "#9AA3AB" }}>
          THIAGO ACCIOLY · BRASÍLIA, DF
        </div>
      </div>
    ),
    {
      ...tamanho,
      fonts: [
        { name: "Archivo", data: archivo, weight: 800, style: "normal" },
        { name: "Mono", data: mono, weight: 500, style: "normal" },
      ],
    },
  );
}
