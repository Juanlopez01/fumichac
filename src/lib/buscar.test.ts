import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filtrarLocales } from "./buscar.ts";

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
