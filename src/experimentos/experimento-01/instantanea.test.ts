import { describe, expect, it } from "vitest";
import { svgDe } from "./instantanea";

describe("instantanea", () => {
  it("arma un SVG del tamaño pedido con el HTML dentro de un foreignObject", () => {
    const svg = svgDe('<main class="x">hola</main>', ".x{color:red}", 480, 686);
    expect(svg).toContain('width="480"');
    expect(svg).toContain('height="686"');
    expect(svg).toContain("<foreignObject");
    expect(svg).toContain('xmlns="http://www.w3.org/1999/xhtml"');
    expect(svg).toContain(".x{color:red}");
  });

  it("el CSS va en CDATA: lo que rompería el XML no lo rompe", () => {
    const svg = svgDe("<p>a</p>", 'a::before{content:"<&>"}', 10, 10);
    expect(svg).toContain('<![CDATA[a::before{content:"<&>"}]]>');
  });

  it("un ]]> dentro del CSS no cierra el CDATA antes de tiempo", () => {
    const svg = svgDe("<p>a</p>", 'a{content:"]]>"}', 10, 10);
    expect(svg.match(/<style><!\[CDATA\[(.*)\]\]><\/style>/s)?.[1]).toBe(
      'a{content:"]]]]><![CDATA[>"}',
    );
  });
});
