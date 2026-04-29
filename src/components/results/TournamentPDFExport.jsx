import React, { useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function TournamentPDFExport({ tournament, teams, matches, allPlayers }) {
  const printRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const finishedMatches = useMemo(
    () => matches.filter((m) => m.estado === "finalizado"),
    [matches]
  );

  const groupMatches = useMemo(
    () => finishedMatches.filter((m) => m.fase === "fase_grupos" || !m.fase),
    [finishedMatches]
  );

  const semifinalMatches = useMemo(
    () => finishedMatches.filter((m) => m.fase === "semifinal"),
    [finishedMatches]
  );

  const finalMatch = useMemo(
    () => finishedMatches.find((m) => m.fase === "final"),
    [finishedMatches]
  );

  const standings = useMemo(() => {
    const allGroupMatches = matches.filter((m) => m.fase === "fase_grupos" || !m.fase);
    const stats = teams.map((team) => {
      const teamMatches = allGroupMatches.filter(
        (m) =>
          (m.equipo1_id === team.id || m.equipo2_id === team.id) &&
          m.estado === "finalizado"
      );
      let ganados = 0;
      let perdidos = 0;
      let setsAFavor = 0;
      let setsEnContra = 0;

      teamMatches.forEach((match) => {
        const isTeam1 = match.equipo1_id === team.id;
        const teamSets = isTeam1 ? match.sets_equipo1 : match.sets_equipo2;
        const opponentSets = isTeam1 ? match.sets_equipo2 : match.sets_equipo1;
        setsAFavor += teamSets || 0;
        setsEnContra += opponentSets || 0;
        if (teamSets > opponentSets) ganados++;
        else if (teamSets < opponentSets) perdidos++;
      });

      return {
        team,
        pj: teamMatches.length,
        ganados,
        perdidos,
        setsAFavor,
        setsEnContra,
        diffSets: setsAFavor - setsEnContra,
      };
    });

    stats.sort((a, b) => {
      if (b.ganados !== a.ganados) return b.ganados - a.ganados;
      return b.diffSets - a.diffSets;
    });

    return stats;
  }, [teams, matches]);

  const getTeamName = (id) => teams.find((t) => t.id === id)?.nombre ?? "—";

  const getMatchWinner = (match) => {
    if (match.estado !== "finalizado") return null;
    return match.sets_equipo1 > match.sets_equipo2
      ? teams.find((t) => t.id === match.equipo1_id)
      : teams.find((t) => t.id === match.equipo2_id);
  };

  const tournamentWinner = finalMatch ? getMatchWinner(finalMatch) : null;

  const getPlayerName = (id) => allPlayers.find((p) => p.id === id)?.nombre ?? "—";

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = pageW / imgW;
      const scaledH = imgH * ratio;

      let heightLeft = scaledH;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pageW, scaledH);
      heightLeft -= pageH;

      while (heightLeft > 0) {
        position -= pageH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageW, scaledH);
        heightLeft -= pageH;
      }

      const fileName = `torneo_${(tournament?.nombre ?? "resumen").replace(/\s+/g, "_")}.pdf`;
      pdf.save(fileName);
      toast.success("PDF generado correctamente");
    } catch {
      toast.error("Error al generar el PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const fechaFormateada = tournament?.fecha_inicio
    ? format(new Date(tournament.fecha_inicio), "d 'de' MMMM yyyy", { locale: es })
    : null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={isGenerating}
        className="border-2 border-sky-200 hover:bg-sky-50 text-sky-700"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FileDown className="w-4 h-4 mr-2" />
        )}
        {isGenerating ? "Generando PDF..." : "Exportar PDF"}
      </Button>

      {/* Contenido oculto que se captura para el PDF */}
      <div style={{ position: "absolute", left: "-9999px", top: 0, zIndex: -1 }}>
        <div
          ref={printRef}
          style={{
            width: "794px",
            backgroundColor: "#ffffff",
            fontFamily: "Arial, sans-serif",
            color: "#1a1a2e",
            padding: "40px",
          }}
        >
          {/* ── Header ── */}
          <div
            style={{
              background: "linear-gradient(135deg, #0ea5e9 0%, #1d4ed8 100%)",
              borderRadius: "12px",
              padding: "32px",
              marginBottom: "28px",
              color: "#ffffff",
            }}
          >
            <div style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", opacity: 0.8, marginBottom: "6px" }}>
              Resumen del Torneo
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", marginBottom: "8px" }}>
              {tournament?.nombre}
            </div>
            {fechaFormateada && (
              <div style={{ fontSize: "13px", opacity: 0.85 }}>{fechaFormateada}</div>
            )}
            <div style={{ marginTop: "16px", display: "flex", gap: "20px", flexWrap: "wrap" }}>
              <Stat label="Equipos" value={teams.length} />
              <Stat label="Partidos jugados" value={finishedMatches.length} />
              <Stat label="Partidos totales" value={matches.length} />
              {tournament?.formato && <Stat label="Formato" value={tournament.formato} />}
            </div>
          </div>

          {/* ── Equipos ── */}
          <Section title="Equipos" color="#0ea5e9">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {teams.map((team) => {
                const isWinner = tournamentWinner?.id === team.id;
                return (
                  <div
                    key={team.id}
                    style={{
                      border: isWinner ? "2px solid #f59e0b" : "1.5px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "14px",
                      backgroundColor: isWinner ? "#fffbeb" : "#f8fafc",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      {isWinner && <span style={{ fontSize: "16px" }}>🏆</span>}
                      <span style={{ fontWeight: "700", fontSize: "14px", color: isWinner ? "#b45309" : "#1e293b" }}>
                        {team.nombre}
                      </span>
                      {team.grupo && (
                        <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "20px", backgroundColor: "#e0f2fe", color: "#0369a1", fontWeight: "600" }}>
                          Grupo {team.grupo}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      {(team.jugadores_ids ?? []).map((pid) => {
                        const isCap = pid === team.capitan_id;
                        return (
                          <div
                            key={pid}
                            style={{ fontSize: "12px", color: isCap ? "#7c3aed" : "#475569", display: "flex", alignItems: "center", gap: "4px" }}
                          >
                            {isCap ? "★ " : "· "}
                            {getPlayerName(pid)}
                            {isCap && <span style={{ fontSize: "10px", color: "#7c3aed" }}>(Cap.)</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ── Partidos disputados ── */}
          {groupMatches.length > 0 && (
            <Section title="Partidos Disputados — Fase de Grupos" color="#0ea5e9">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f1f5f9" }}>
                    {["#", "Equipo 1", "Set 1", "Set 2", "Set 3", "Resultado", "Equipo 2"].map((h) => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "center", fontWeight: "700", color: "#475569", borderBottom: "1.5px solid #cbd5e1" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groupMatches.map((match, i) => {
                    const winner = getMatchWinner(match);
                    const t1win = winner?.id === match.equipo1_id;
                    const t2win = winner?.id === match.equipo2_id;
                    return (
                      <tr key={match.id} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                        <td style={{ padding: "7px 10px", textAlign: "center", color: "#94a3b8", fontWeight: "600" }}>{match.numero_partido}</td>
                        <td style={{ padding: "7px 10px", fontWeight: t1win ? "700" : "400", color: t1win ? "#16a34a" : "#1e293b" }}>
                          {t1win ? "✓ " : ""}{getTeamName(match.equipo1_id)}
                        </td>
                        <td style={{ padding: "7px 10px", textAlign: "center" }}>{match.set1_equipo1} - {match.set1_equipo2}</td>
                        <td style={{ padding: "7px 10px", textAlign: "center" }}>{match.set2_equipo1} - {match.set2_equipo2}</td>
                        <td style={{ padding: "7px 10px", textAlign: "center", color: "#94a3b8" }}>
                          {match.set3_equipo1 != null ? `${match.set3_equipo1} - ${match.set3_equipo2}` : "—"}
                        </td>
                        <td style={{ padding: "7px 10px", textAlign: "center", fontWeight: "700", fontSize: "13px" }}>
                          {match.sets_equipo1} - {match.sets_equipo2}
                        </td>
                        <td style={{ padding: "7px 10px", fontWeight: t2win ? "700" : "400", color: t2win ? "#16a34a" : "#1e293b", textAlign: "right" }}>
                          {getTeamName(match.equipo2_id)}{t2win ? " ✓" : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Section>
          )}

          {/* ── Tabla de posiciones ── */}
          {standings.length > 0 && groupMatches.length > 0 && (
            <Section title="Tabla de Posiciones" color="#8b5cf6">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f5f3ff" }}>
                    {["Pos.", "Equipo", "PJ", "PG", "PP", "Sets A Favor", "Sets En Contra", "Diff"].map((h) => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "center", fontWeight: "700", color: "#5b21b6", borderBottom: "1.5px solid #ddd6fe" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s, i) => (
                    <tr
                      key={s.team.id}
                      style={{
                        backgroundColor:
                          i === 0 ? "#fefce8" : i === 1 ? "#f8fafc" : "#ffffff",
                        borderLeft: i === 0 ? "3px solid #f59e0b" : i === 1 ? "3px solid #94a3b8" : "none",
                      }}
                    >
                      <td style={{ padding: "7px 10px", textAlign: "center", fontWeight: "700" }}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </td>
                      <td style={{ padding: "7px 10px", fontWeight: "600" }}>{s.team.nombre}</td>
                      <td style={{ padding: "7px 10px", textAlign: "center" }}>{s.pj}</td>
                      <td style={{ padding: "7px 10px", textAlign: "center", color: "#16a34a", fontWeight: "600" }}>{s.ganados}</td>
                      <td style={{ padding: "7px 10px", textAlign: "center", color: "#dc2626", fontWeight: "600" }}>{s.perdidos}</td>
                      <td style={{ padding: "7px 10px", textAlign: "center" }}>{s.setsAFavor}</td>
                      <td style={{ padding: "7px 10px", textAlign: "center" }}>{s.setsEnContra}</td>
                      <td style={{ padding: "7px 10px", textAlign: "center", fontWeight: "700", color: s.diffSets >= 0 ? "#16a34a" : "#dc2626" }}>
                        {s.diffSets > 0 ? "+" : ""}{s.diffSets}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* ── Fases Finales ── */}
          {(semifinalMatches.length > 0 || finalMatch) && (
            <Section title="Fases Finales" color="#f59e0b">
              {semifinalMatches.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontWeight: "700", fontSize: "13px", color: "#7c3aed", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Semifinales
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    {semifinalMatches.map((match) => {
                      const winner = getMatchWinner(match);
                      return (
                        <PlayoffCard
                          key={match.id}
                          match={match}
                          t1name={getTeamName(match.equipo1_id)}
                          t2name={getTeamName(match.equipo2_id)}
                          winner={winner}
                          accentColor="#7c3aed"
                          bgColor="#faf5ff"
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {finalMatch && (
                <div>
                  <div style={{ fontWeight: "700", fontSize: "13px", color: "#b45309", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Final
                  </div>
                  <PlayoffCard
                    match={finalMatch}
                    t1name={getTeamName(finalMatch.equipo1_id)}
                    t2name={getTeamName(finalMatch.equipo2_id)}
                    winner={getMatchWinner(finalMatch)}
                    accentColor="#f59e0b"
                    bgColor="#fffbeb"
                    isFinal
                  />
                </div>
              )}
            </Section>
          )}

          {/* ── Campeón ── */}
          {tournamentWinner && (
            <div
              style={{
                marginTop: "24px",
                background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
                borderRadius: "14px",
                padding: "28px",
                textAlign: "center",
                color: "#ffffff",
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "6px" }}>🏆</div>
              <div style={{ fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", opacity: 0.85, marginBottom: "6px" }}>
                Campeón del Torneo
              </div>
              <div style={{ fontSize: "30px", fontWeight: "900" }}>{tournamentWinner.nombre}</div>
              {(tournamentWinner.jugadores_ids ?? []).length > 0 && (
                <div style={{ marginTop: "12px", fontSize: "13px", opacity: 0.9 }}>
                  {(tournamentWinner.jugadores_ids ?? []).map((pid) => getPlayerName(pid)).join(" · ")}
                </div>
              )}
            </div>
          )}

          {/* Pie de página */}
          <div style={{ marginTop: "24px", textAlign: "center", fontSize: "10px", color: "#94a3b8" }}>
            Línea De Afuera · Generado el {format(new Date(), "d 'de' MMMM yyyy", { locale: es })}
          </div>
        </div>
      </div>
    </>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <div style={{ width: "4px", height: "20px", backgroundColor: color, borderRadius: "2px" }} />
        <span style={{ fontWeight: "700", fontSize: "15px", color: "#1e293b" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "8px", padding: "8px 14px", textAlign: "center" }}>
      <div style={{ fontSize: "18px", fontWeight: "800" }}>{value}</div>
      <div style={{ fontSize: "10px", opacity: 0.8, marginTop: "2px" }}>{label}</div>
    </div>
  );
}

function PlayoffCard({ match, t1name, t2name, winner, accentColor, bgColor, isFinal = false }) {
  const t1win = winner?.id === match.equipo1_id;
  const t2win = winner?.id === match.equipo2_id;

  return (
    <div
      style={{
        border: `2px solid ${accentColor}`,
        borderRadius: "10px",
        padding: "14px",
        backgroundColor: bgColor,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ fontSize: "11px", color: accentColor, fontWeight: "700", textTransform: "uppercase" }}>
          {isFinal ? "FINAL" : "Semifinal"}
        </div>
        {match.estado === "finalizado" && (
          <div style={{ fontWeight: "800", fontSize: "18px", color: "#1e293b" }}>
            {match.sets_equipo1} — {match.sets_equipo2}
          </div>
        )}
      </div>

      <TeamRow name={t1name} isWinner={t1win} isFinal={isFinal} />
      <div style={{ height: "1px", backgroundColor: "#e2e8f0", margin: "6px 0" }} />
      <TeamRow name={t2name} isWinner={t2win} isFinal={isFinal} />

      {match.estado === "finalizado" && (
        <div style={{ marginTop: "10px", display: "flex", gap: "6px", justifyContent: "center" }}>
          {[
            { s1: match.set1_equipo1, s2: match.set1_equipo2, label: "Set 1" },
            { s1: match.set2_equipo1, s2: match.set2_equipo2, label: "Set 2" },
            ...(match.set3_equipo1 != null
              ? [{ s1: match.set3_equipo1, s2: match.set3_equipo2, label: "Set 3" }]
              : []),
          ].map(({ s1, s2, label }) => (
            <div key={label} style={{ textAlign: "center", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "4px 8px", minWidth: "52px" }}>
              <div style={{ fontSize: "9px", color: "#94a3b8", marginBottom: "2px" }}>{label}</div>
              <div style={{ fontSize: "12px", fontWeight: "700" }}>{s1} - {s2}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TeamRow({ name, isWinner, isFinal }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      {isWinner && <span style={{ fontSize: isFinal ? "16px" : "13px" }}>🏆</span>}
      <span
        style={{
          fontWeight: isWinner ? "800" : "500",
          fontSize: "13px",
          color: isWinner ? "#b45309" : "#475569",
        }}
      >
        {name}
      </span>
    </div>
  );
}
