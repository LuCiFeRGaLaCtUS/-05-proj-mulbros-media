// PDF export for the Incentive Analyst tab. Keeps jsPDF behind a dynamic import
// so the ~570 KB vendor chunk stays out of the initial bundle.

export const exportIncentivePdf = async (result) => {
  if (!result) return;
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const MARGIN = 40;
  const INNER_W = W - MARGIN * 2;
  const LINE_H = 14;
  let y = 68;

  const safe = (s = '') => s.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').replace(/[^\x00-\xFF]/g, '').trim();
  const creditPct = (s = '') => s.split(' ')[0];

  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, W, 36, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('MulBros Media OS  —  Film Tax Incentive Benchmark', MARGIN, 23);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    W - MARGIN, 23, { align: 'right' }
  );

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(safe(result.project?.title) || 'Your Project', MARGIN, y);
  y += 18;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(110, 110, 110);
  doc.text(
    `Genre: ${result.project?.genre || '—'}   |   Budget: ${result.project?.budget || '—'}   |   Region: ${result.project?.region || '—'}`,
    MARGIN, y
  );
  y += 22;

  doc.setDrawColor(220, 220, 220);
  doc.line(MARGIN, y, W - MARGIN, y);
  y += 16;

  const REASON_W = INNER_W * 0.58;
  doc.setFontSize(9);
  const reasonLines = doc.splitTextToSize(safe(result.topPick?.reason) || '', REASON_W);
  const heroInnerH  = 20 + 20 + (reasonLines.length * LINE_H) + 16;
  const heroH       = Math.max(heroInnerH, 90);

  doc.setFillColor(235, 245, 255);
  doc.roundedRect(MARGIN - 8, y, INNER_W + 16, heroH, 6, 6, 'F');

  const lx = MARGIN;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text('TOP RECOMMENDATION', lx, y + 14);

  doc.setFontSize(15);
  doc.setTextColor(15, 15, 15);
  doc.text(safe(result.topPick?.location) || '—', lx, y + 30);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(reasonLines, lx, y + 46);

  const rx = W - MARGIN;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(16, 185, 129);
  doc.text(safe(result.topPick?.savings) || '', rx, y + 22, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Estimated savings', rx, y + 34, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(59, 130, 246);
  doc.text(creditPct(result.topPick?.credit), rx, y + 52, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Tax credit', rx, y + 64, { align: 'right' });

  y += heroH + 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text('Location Comparison', MARGIN, y);
  y += 12;

  const cX = [MARGIN, 220, 300, 390, 470, 530];
  const cH = ['Location', 'Credit %', 'Est. Savings', 'Min. Spend', 'Qualified', 'Refundable'];

  doc.setFillColor(230, 230, 230);
  doc.rect(MARGIN - 8, y, INNER_W + 16, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  cH.forEach((h, i) => doc.text(h, cX[i], y + 12));
  y += 20;

  doc.setFontSize(9);
  (result.comparison || []).forEach((row, idx) => {
    const isTop = safe(row.location) === safe(result.topPick?.location);
    if (isTop) {
      doc.setFillColor(219, 234, 254);
    } else if (idx % 2 === 0) {
      doc.setFillColor(248, 248, 248);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(MARGIN - 8, y, INNER_W + 16, 18, 'F');

    doc.setFont(isTop ? 'helvetica' : 'helvetica', isTop ? 'bold' : 'normal');
    doc.setTextColor(20, 20, 20);
    const locLabel = safe(row.location) + (isTop ? '  [Best]' : '');
    doc.text(locLabel, cX[0], y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(59, 130, 246);
    doc.text(creditPct(row.credit) || '', cX[1], y + 12);

    doc.setTextColor(16, 185, 129);
    doc.text(safe(row.savings) || '', cX[2], y + 12);

    doc.setTextColor(80, 80, 80);
    doc.text(safe(row.minSpend) || '', cX[3], y + 12);

    const qual = (safe(row.qualified) || '').slice(0, 12);
    doc.text(qual, cX[4], y + 12);

    doc.setTextColor(row.refundable ? 16 : 130, row.refundable ? 185 : 130, row.refundable ? 129 : 130);
    doc.setFont('helvetica', row.refundable ? 'bold' : 'normal');
    doc.text(row.refundable ? 'Yes' : 'No', cX[5], y + 12);

    y += 20;
  });
  y += 16;

  if (y > 580) { doc.addPage(); y = MARGIN; }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(`Itemized Budget Template  —  ${safe(result.topPick?.location) || ''}`, MARGIN, y);
  y += 12;

  const bX = [MARGIN, 200, 295, 360];
  const bH = ['Category', 'Estimate', 'Qualified', 'Notes'];

  doc.setFillColor(230, 230, 230);
  doc.rect(MARGIN - 8, y, INNER_W + 16, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  bH.forEach((h, i) => doc.text(h, bX[i], y + 12));
  y += 20;

  doc.setFontSize(9);
  (result.budgetTemplate || []).forEach((row, idx) => {
    const noteLines = doc.splitTextToSize(safe(row.notes) || '', INNER_W - (bX[3] - MARGIN) - 8);
    const rowH = Math.max(18, (noteLines.length * LINE_H) + 8);

    if (idx % 2 === 0) { doc.setFillColor(248, 248, 248); } else { doc.setFillColor(255, 255, 255); }
    doc.rect(MARGIN - 8, y, INNER_W + 16, rowH, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    doc.text(safe(row.category) || '', bX[0], y + 12);

    doc.setTextColor(60, 60, 60);
    doc.text(safe(row.estimate) || '', bX[1], y + 12);

    const isQual = (safe(row.qualified) || '').toLowerCase().startsWith('y');
    doc.setTextColor(isQual ? 16 : 130, isQual ? 185 : 130, isQual ? 129 : 130);
    doc.setFont('helvetica', 'bold');
    doc.text(isQual ? 'Yes' : 'No', bX[2], y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(noteLines, bX[3], y + 12);

    y += rowH;
  });
  y += 16;

  if (y > 680) { doc.addPage(); y = MARGIN; }
  doc.setFontSize(9);
  const nextLines = doc.splitTextToSize(safe(result.nextStep) || '', INNER_W - 24);
  const nextH = 22 + (nextLines.length * LINE_H) + 12;

  doc.setFillColor(235, 245, 255);
  doc.roundedRect(MARGIN - 8, y, INNER_W + 16, nextH, 4, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(59, 130, 246);
  doc.text('RECOMMENDED NEXT STEP', MARGIN, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text(nextLines, MARGIN, y + 28);
  y += nextH + 8;

  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(7.5);
  doc.setTextColor(180, 180, 180);
  doc.text(
    'MulBros Media OS  —  Confidential. For internal use only. Tax incentive figures based on Q1 2026 data; verify with a qualified accountant before filing.',
    MARGIN, pageH - 18
  );

  const slug = (result.project?.title || 'benchmark').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  doc.save(`mulbros-incentive-benchmark-${slug}.pdf`);
};
