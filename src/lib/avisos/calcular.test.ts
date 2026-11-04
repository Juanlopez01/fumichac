import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calcularAvisos,
  diasEntre,
  hoyArgentina,
  sumarDias,
  type CertificadoParaAviso,
  type LocalParaAviso,
} from "./calcular.ts";

const HOY = "2026-11-04";

const certificado = (dias: number): CertificadoParaAviso => ({
  id: "c1",
  local_id: "l1",
  local_nombre: "Local Centro",
  vencimiento: sumarDias(HOY, dias),
});

const local = (cambios: Partial<LocalParaAviso>): LocalParaAviso => ({
  id: "l1",
  nombre: "Local Centro",
  frecuencia_dias: 30,
  ultima_fumigacion: null,
  ...cambios,
});

describe("fechas", () => {
  it("usa el día de Argentina aunque en UTC ya sea mañana", () => {
    assert.equal(hoyArgentina(new Date("2026-11-05T02:00:00Z")), "2026-11-04");
  });

  it("cuenta días a través de cambios de mes y año", () => {
    assert.equal(diasEntre("2026-12-31", "2027-01-01"), 1);
    assert.equal(sumarDias("2026-11-30", 1), "2026-12-01");
  });
});

describe("avisos de certificados", () => {
  const clave = (dias: number) => calcularAvisos(HOY, [certificado(dias)], [])[0]?.clave;

  it("no avisa con más de 30 días", () => {
    assert.equal(clave(31), undefined);
  });

  it("usa el umbral más cercano", () => {
    const fecha = (dias: number) => sumarDias(HOY, dias);
    assert.equal(clave(30), `certificado:c1:${fecha(30)}:30`);
    assert.equal(clave(16), `certificado:c1:${fecha(16)}:30`);
    assert.equal(clave(15), `certificado:c1:${fecha(15)}:15`);
    assert.equal(clave(7), `certificado:c1:${fecha(7)}:7`);
    assert.equal(clave(5), `certificado:c1:${fecha(5)}:7`);
    assert.equal(clave(0), `certificado:c1:${fecha(0)}:0`);
  });

  it("avisa una vez más después de vencido", () => {
    assert.equal(clave(-1), `certificado:c1:${sumarDias(HOY, -1)}:vencido`);
    assert.equal(clave(-10), `certificado:c1:${sumarDias(HOY, -10)}:vencido`);
  });

  it("ignora los vencidos hace más de 30 días", () => {
    assert.equal(clave(-30), `certificado:c1:${sumarDias(HOY, -30)}:vencido`);
    assert.equal(clave(-31), undefined);
  });

  it("arma el texto con días y fecha", () => {
    const [aviso] = calcularAvisos(HOY, [certificado(1)], []);
    assert.equal(aviso.titulo, "Certificado vence en 1 día: Local Centro");
    assert.equal(aviso.cuerpo, "Fecha de vencimiento: 05/11/2026");
    assert.equal(aviso.url, "/locales/l1");
    assert.equal(aviso.certificado_id, "c1");
  });
});

describe("avisos de fumigación", () => {
  const avisos = (cambios: Partial<LocalParaAviso>) => calcularAvisos(HOY, [], [local(cambios)]);

  it("no avisa antes de cumplir la frecuencia", () => {
    assert.deepEqual(avisos({ ultima_fumigacion: sumarDias(HOY, -29) }), []);
  });

  it("avisa al cumplirla, con clave atada a la última fumigación", () => {
    const fecha = sumarDias(HOY, -30);
    const [aviso] = avisos({ ultima_fumigacion: fecha });
    assert.equal(aviso.clave, `fumigacion:l1:${fecha}`);
    assert.equal(aviso.tipo, "fumigacion");
    assert.equal(aviso.certificado_id, null);
  });

  it("no cambia la clave con el paso de los días", () => {
    const fecha = sumarDias(HOY, -30);
    const hoy = calcularAvisos(HOY, [], [local({ ultima_fumigacion: fecha })]);
    const manana = calcularAvisos(sumarDias(HOY, 1), [], [local({ ultima_fumigacion: fecha })]);
    assert.equal(hoy[0].clave, manana[0].clave);
  });

  it("respeta la frecuencia de cada local", () => {
    assert.equal(avisos({ frecuencia_dias: 90, ultima_fumigacion: sumarDias(HOY, -60) }).length, 0);
    assert.equal(avisos({ frecuencia_dias: 15, ultima_fumigacion: sumarDias(HOY, -15) }).length, 1);
  });

  it("no avisa sin frecuencia ni sin fumigaciones previas", () => {
    assert.deepEqual(avisos({ frecuencia_dias: null, ultima_fumigacion: sumarDias(HOY, -400) }), []);
    assert.deepEqual(avisos({ ultima_fumigacion: null }), []);
  });
});
