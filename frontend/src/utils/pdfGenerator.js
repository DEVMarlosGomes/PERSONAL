import jsPDF from "jspdf";
import "jspdf-autotable";

export const generateStudentReport = async (reportData) => {
  const { student, workouts, progress_count, exercises_count, evolution, generated_at } = reportData;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("FITMASTER", pageWidth / 2, 20, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Relatório de Progresso", pageWidth / 2, 28, { align: "center" });
  
  // Student Info
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Informações do Aluno", 14, 45);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${student.name}`, 14, 55);
  doc.text(`Email: ${student.email}`, 14, 62);
  doc.text(`Telefone: ${student.phone || "Não informado"}`, 14, 69);
  doc.text(`Cadastro: ${new Date(student.created_at).toLocaleDateString("pt-BR")}`, 14, 76);
  
  // Stats
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Estatísticas", 14, 95);
  
  const statsData = [
    ["Total de Treinos Registrados", progress_count.toString()],
    ["Exercícios Diferentes", exercises_count.toString()],
    ["Treinos Ativos", workouts.length.toString()],
  ];
  
  doc.autoTable({
    startY: 100,
    head: [["Métrica", "Valor"]],
    body: statsData,
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: 14, right: 14 },
  });
  
  // Current Workout
  if (workouts.length > 0) {
    const workout = workouts[0];
    let yPos = doc.lastAutoTable.finalY + 15;
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`Treino Atual: ${workout.name}`, 14, yPos);
    
    yPos += 10;
    
    workout.days?.forEach((day, idx) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(day.day_name, 14, yPos);
      yPos += 5;
      
      const exerciseData = day.exercises?.map(ex => [
        ex.name,
        ex.muscle_group || "-",
        `${ex.sets}x ${ex.reps}`,
        ex.weight || "-",
      ]) || [];
      
      if (exerciseData.length > 0) {
        doc.autoTable({
          startY: yPos,
          head: [["Exercício", "Grupo", "Séries x Reps", "Carga"]],
          body: exerciseData,
          theme: "striped",
          headStyles: { fillColor: [37, 99, 235] },
          margin: { left: 14, right: 14 },
          styles: { fontSize: 9 },
        });
        yPos = doc.lastAutoTable.finalY + 10;
      }
    });
  }
  
  // Evolution Summary
  if (Object.keys(evolution).length > 0) {
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Evolução por Exercício", 14, 20);
    
    let yPos = 30;
    
    Object.entries(evolution).forEach(([exerciseName, data]) => {
      if (data.length < 2) return;
      
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(exerciseName, 14, yPos);
      yPos += 5;
      
      const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
      const first = sortedData[0];
      const last = sortedData[sortedData.length - 1];
      const diff = last.weight - first.weight;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Primeira carga: ${first.weight}kg (${first.date})`, 14, yPos + 5);
      doc.text(`Última carga: ${last.weight}kg (${last.date})`, 14, yPos + 11);
      doc.text(`Evolução: ${diff > 0 ? "+" : ""}${diff.toFixed(1)}kg`, 14, yPos + 17);
      
      yPos += 30;
    });
  }
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Gerado em ${new Date(generated_at).toLocaleString("pt-BR")} | Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }
  
  // Save
  doc.save(`relatorio_${student.name.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
};
