import React, { useState } from "react";

// COMPONENTE DE CALENDÁRIO (TRIMESTRE/BIMESTRE)
const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Troque aqui para 2 (bimestre) ou 3 (trimestre)
const PERIOD_MONTHS = 3; 

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export const CalendarCard: React.FC = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Navegação do calendário
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Criação dos elementos de dia do calendário
  function renderCalendarDays() {
    const days: React.ReactNode[] = [];
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = 32 - new Date(currentYear, currentMonth, 32).getDate();

    // Dias do mês anterior
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`prev-${i}`} className="text-gray-300">{prevMonthDays - firstDay + 1 + i}</div>
      );
    }

    // Dias deste mês
    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected =
        selectedDate &&
        selectedDate.getFullYear() === currentYear &&
        selectedDate.getMonth() === currentMonth &&
        selectedDate.getDate() === d;
      days.push(
        <div
          key={`day-${d}`}
          className={`cursor-pointer hover:bg-[var(--primary-color)] hover:text-white hover:scale-110 transform transition-all duration-75 rounded-full p-1 text-[var(--text-primary)] font-medium
            ${isSelected ? "ring-2 ring-[var(--primary-color)] bg-[var(--primary-color)] text-white font-extrabold scale-110" : ""}
          `}
          onClick={() => setSelectedDate(new Date(currentYear, currentMonth, d))}
        >
          {d}
        </div>
      );
    }

    // Dias do próximo mês
    const totalCells = firstDay + daysInMonth;
    const nextDays = (42 - totalCells > 7 ? 7-(totalCells%7): (7 - totalCells%7===7?0:7-totalCells%7));
    for (let i = 0; i < nextDays; i++) {
      days.push(
        <div key={`next-${i}`} className="text-gray-300">{i + 1}</div>
      );
    }
    return days;
  }

  // Formatar datas do período (fundo preto, fonte branca)
  function renderPeriod() {
    if (!selectedDate) return null;

    const dtIni = new Date(selectedDate);
    const dtFim = new Date(selectedDate);
    dtFim.setMonth(dtFim.getMonth() + PERIOD_MONTHS);
    dtFim.setDate(dtFim.getDate() - 1);

    const format = (d: Date) => (
      <span
        className="inline-block rounded-md px-4 py-2 mx-1 font-semibold text-base"
        style={{ background: "#111418", color: "white", minWidth: 112, textAlign: "center" }}
      >
        {pad(d.getDate())}/{pad(d.getMonth() + 1)}/{d.getFullYear()}
      </span>
    );

    return (
      <div className="flex items-center justify-center gap-1 px-3 py-3 rounded-lg bg-[var(--secondary-color)]">
        {format(dtIni)}
        <span className="mx-2 text-[var(--text-secondary)] font-bold text-base" style={{ fontWeight: 400, fontSize: "1.1rem" }}>a</span>
        {format(dtFim)}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {/* Card calendário */}
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6 flex flex-col items-center">
        <div className="w-full">
          {/* Cabeçalho calendário */}
          <div className="flex items-center justify-between mb-2">
            <button type="button"
              className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-gray-100"
              onClick={goToPrevMonth}
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <button type="button"
              className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-gray-100"
              onClick={goToNextMonth}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          {/* Grade dias calendário */}
          <div className="grid grid-cols-7 gap-y-2 text-center text-sm select-none">
            <div className="font-medium text-[var(--text-secondary)]">D</div>
            <div className="font-medium text-[var(--text-secondary)]">S</div>
            <div className="font-medium text-[var(--text-secondary)]">T</div>
            <div className="font-medium text-[var(--text-secondary)]">Q</div>
            <div className="font-medium text-[var(--text-secondary)]">Q</div>
            <div className="font-medium text-[var(--text-secondary)]">S</div>
            <div className="font-medium text-[var(--text-secondary)]">S</div>
          </div>
          <div className="grid grid-cols-7 gap-y-2 text-center text-sm mt-1">
            {renderCalendarDays()}
          </div>
        </div>
        {/* Exibição do período selecionado */}
        <div className="w-full mt-6 flex justify-center">{renderPeriod()}</div>
        {/* Botão confirmar */}
        <button
          className={`mt-4 w-full rounded-lg bg-[var(--primary-color)] py-3 px-5 text-base font-bold text-white transition hover:bg-opacity-90 focus:outline-none ${selectedDate ? "" : "hidden"}`}
          onClick={() => alert("Período confirmado!")}
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};

export default CalendarCard;
