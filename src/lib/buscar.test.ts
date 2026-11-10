import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buscarCoincidencias, filtrarLocales } from "./buscar.ts";

const locales = [
  { nombre: "Panadería Central", direccion: "San Martín 123", rubro: "Panadería", telefono: "3875551234" },
  { nombre: "Pérez, Juana", direccion: "Belgrano 50", rubro: "Kiosco", telefono: null },
  { nombre: "Depósito Norte SRL", direccion: null, rubro: null, telefono: "3871112222" },
];

const nombres = (busqueda: string) => filtrarLocales(locales, busqueda).map((l) => l.nombre);

describe("filtrarLocales", () => {
  it("sin búsqueda devuelve todos", () => {
    assert.equal(nombres("").length, 3);
    assert.equal(nombres("   ").length, 3);
  });

  it("ignora acentos y mayúsculas, en los dos sentidos", () => {
    assert.deepEqual(nombres("PANADERIA"), ["Panadería Central"]);
    assert.deepEqual(nombres("perez"), ["Pérez, Juana"]);
    assert.deepEqual(nombres("depósito"), ["Depósito Norte SRL"]);
  });

  it("busca en dirección, rubro y teléfono", () => {
    assert.deepEqual(nombres("belgrano"), ["Pérez, Juana"]);
    assert.deepEqual(nombres("kiosco"), ["Pérez, Juana"]);
    assert.deepEqual(nombres("387111"), ["Depósito Norte SRL"]);
  });

  it("exige todas las palabras, en cualquier orden", () => {
    assert.deepEqual(nombres("central martin"), ["Panadería Central"]);
    assert.deepEqual(nombres("juana central"), []);
  });

  it("no se rompe con datos vacíos ni caracteres especiales", () => {
    assert.deepEqual(nombres("(%*"), []);
  });
});

describe("buscarCoincidencias", () => {
  const guardados = [
    { nombre: "Panadería Central", direccion: "Av. San Martín 123" },
    { nombre: "Pérez, Juana", direccion: "Belgrano 50" },
    { nombre: "Kiosco 24", direccion: null },
  ];
  const coinciden = (nombre: string, direccion = "") =>
    buscarCoincidencias(guardados, { nombre, direccion }).map((l) => l.nombre);

  it("encuentra el mismo nombre sin acentos, mayúsculas ni signos", () => {
    assert.deepEqual(coinciden("panaderia central"), ["Panadería Central"]);
    assert.deepEqual(coinciden("PEREZ JUANA"), ["Pérez, Juana"]);
  });

  it("encuentra un nombre contenido en otro", () => {
    assert.deepEqual(coinciden("Panadería Central SRL"), ["Panadería Central"]);
  });

  it("encuentra la misma dirección aunque cambie el prefijo", () => {
    assert.deepEqual(coinciden("Otro nombre", "san martin 123"), ["Panadería Central"]);
  });

  it("no confunde números de calle distintos", () => {
    assert.deepEqual(coinciden("Otro nombre", "San Martín 1234"), []);
    assert.deepEqual(coinciden("Otro nombre", "Belgrano 5"), []);
  });

  it("no sugiere por textos muy cortos ni vacíos", () => {
    assert.deepEqual(coinciden(""), []);
    assert.deepEqual(coinciden("pan"), []);
    assert.deepEqual(coinciden("Kiosco"), ["Kiosco 24"]);
  });
});
