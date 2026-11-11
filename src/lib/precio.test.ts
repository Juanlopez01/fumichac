import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatearPrecio, parsearPrecio, precioEditable } from "./precio.ts";

describe("parsearPrecio", () => {
  it("vacío es sin precio", () => {
    assert.equal(parsearPrecio(""), null);
    assert.equal(parsearPrecio("  "), null);
  });

  it("entiende números simples y el signo $", () => {
    assert.equal(parsearPrecio("15000"), 15000);
    assert.equal(parsearPrecio("$ 15000"), 15000);
    assert.equal(parsearPrecio("0"), 0);
  });

  it("toma el punto de miles", () => {
    assert.equal(parsearPrecio("15.000"), 15000);
    assert.equal(parsearPrecio("1.250.000"), 1250000);
  });

  it("toma la coma decimal, con o sin miles", () => {
    assert.equal(parsearPrecio("1.500,50"), 1500.5);
    assert.equal(parsearPrecio("1500,5"), 1500.5);
  });

  it("toma el punto como decimal cuando no son tres dígitos", () => {
    assert.equal(parsearPrecio("15.5"), 15.5);
    assert.equal(parsearPrecio("15.50"), 15.5);
  });

  it("rechaza lo que no es un precio", () => {
    assert.equal(parsearPrecio("abc"), undefined);
    assert.equal(parsearPrecio("-500"), undefined);
    assert.equal(parsearPrecio("15,505"), undefined);
    assert.equal(parsearPrecio("99999999999"), undefined);
  });
});

describe("formato", () => {
  it("muestra pesos con miles y decimales solo si hay", () => {
    assert.equal(formatearPrecio(15000).replace(/\s/g, " "), "$ 15.000");
    assert.equal(formatearPrecio(1500.5).replace(/\s/g, " "), "$ 1.500,50");
  });

  it("precarga sin miles y con coma, y vuelve a leerse igual", () => {
    assert.equal(precioEditable(1500.5), "1500,50");
    assert.equal(precioEditable(15000), "15000");
    assert.equal(precioEditable(null), "");
    assert.equal(parsearPrecio(precioEditable(1500.5)), 1500.5);
    assert.equal(parsearPrecio(precioEditable(15000)), 15000);
  });
});
