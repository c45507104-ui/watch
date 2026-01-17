import jsPDF from 'jspdf';
import { supabase, Packet, Threat } from './supabase';

export async function exportThreatDataToPDF() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 10;

  const addText = (text: string, options: { size?: number; bold?: boolean; color?: [number, number, number]; y?: number } = {}) => {
    const { size = 12, bold = false, color = [0, 0, 0], y } = options;
    if (y !== undefined) yPosition = y;

    doc.setFontSize(size);
    doc.setTextColor(...color);
    if (bold) doc.setFont(undefined, 'bold');
    else doc.setFont(undefined, 'normal');

    const lines = doc.splitTextToSize(text, pageWidth - 20);
    doc.text(lines, 10, yPosition);
    yPosition += size * 0.5 * lines.length + 5;

    if (yPosition > pageHeight - 15) {
      doc.addPage();
      yPosition = 10;
    }
  };

  const loadData = async () => {
    const [packets, threats] = await Promise.all([
      supabase.from('packets').select('*').order('captured_at', { ascending: false }),
      supabase.from('threats').select('*').order('last_seen', { ascending: false })
    ]);

    return {
      packets: packets.data || [],
      threats: threats.data || []
    };
  };

  const data = await loadData();

  addText('THREATWATCH SOC - THREAT INTELLIGENCE REPORT', { size: 20, bold: true, color: [220, 38, 38] });
  addText(`Generated: ${new Date().toLocaleString()}`, { size: 10, color: [100, 100, 100] });

  yPosition += 5;

  addText('EXECUTIVE SUMMARY', { size: 14, bold: true, color: [30, 58, 138] });

  const totalPackets = data.packets.length;
  const maliciousPackets = data.packets.filter(p => p.is_malicious).length;
  const threatRate = totalPackets > 0 ? ((maliciousPackets / totalPackets) * 100).toFixed(2) : '0.00';
  const uniqueThreats = new Set(data.threats.map(t => t.ip_address)).size;

  addText(`Total Packets Analyzed: ${totalPackets.toLocaleString()}`, { size: 11 });
  addText(`Malicious Packets Detected: ${maliciousPackets.toLocaleString()}`, { size: 11 });
  addText(`Threat Detection Rate: ${threatRate}%`, { size: 11 });
  addText(`Unique Threat IPs: ${uniqueThreats}`, { size: 11 });

  yPosition += 3;

  const countryCount = data.packets
    .filter(p => p.is_malicious && p.country)
    .reduce((acc, p) => {
      acc[p.country!] = (acc[p.country!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topCountries = Object.entries(countryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const threatCount = data.packets
    .filter(p => p.is_malicious && p.threat_type)
    .reduce((acc, p) => {
      acc[p.threat_type!] = (acc[p.threat_type!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topThreats = Object.entries(threatCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (topCountries.length > 0) {
    addText('TOP THREAT ORIGINS', { size: 12, bold: true, color: [30, 58, 138] });
    topCountries.forEach(([country, count]) => {
      addText(`${country}: ${count} threats`, { size: 10 });
    });
    yPosition += 2;
  }

  if (topThreats.length > 0) {
    addText('TOP THREAT TYPES', { size: 12, bold: true, color: [30, 58, 138] });
    topThreats.forEach(([type, count]) => {
      addText(`${type}: ${count} detections`, { size: 10 });
    });
    yPosition += 2;
  }

  addText('CRITICAL THREATS', { size: 14, bold: true, color: [30, 58, 138] });

  const criticalThreats = data.threats
    .filter(t => t.severity === 'critical')
    .slice(0, 10);

  if (criticalThreats.length > 0) {
    criticalThreats.forEach((threat, idx) => {
      addText(`${idx + 1}. IP: ${threat.ip_address}`, { size: 10, bold: true });
      addText(`   Country: ${threat.country || 'Unknown'}`, { size: 9 });
      addText(`   Types: ${threat.threat_types.join(', ')}`, { size: 9 });
      addText(`   Severity: ${threat.severity.toUpperCase()}`, { size: 9, color: [220, 38, 38] });
      addText(`   Detections: ${threat.count}`, { size: 9 });
      addText(`   Reports: ${threat.reports.join(', ')}`, { size: 9 });
      addText(`   Last Seen: ${new Date(threat.last_seen).toLocaleString()}`, { size: 9 });
      yPosition += 2;
    });
  } else {
    addText('No critical threats detected', { size: 10 });
  }

  addText('HIGH SEVERITY THREATS', { size: 14, bold: true, color: [30, 58, 138] });

  const highThreats = data.threats
    .filter(t => t.severity === 'high')
    .slice(0, 10);

  if (highThreats.length > 0) {
    highThreats.forEach((threat, idx) => {
      addText(`${idx + 1}. IP: ${threat.ip_address}`, { size: 10, bold: true });
      addText(`   Country: ${threat.country || 'Unknown'}`, { size: 9 });
      addText(`   Types: ${threat.threat_types.join(', ')}`, { size: 9 });
      addText(`   Detections: ${threat.count}`, { size: 9 });
      yPosition += 2;
    });
  } else {
    addText('No high severity threats detected', { size: 10 });
  }

  addText('RECENT MALICIOUS PACKETS', { size: 14, bold: true, color: [30, 58, 138] });

  const recentMalicious = data.packets
    .filter(p => p.is_malicious)
    .slice(0, 20);

  recentMalicious.forEach((packet, idx) => {
    addText(`${idx + 1}. ${packet.source_ip} -> ${packet.dest_ip}`, { size: 9, bold: true });
    addText(`   Protocol: ${packet.protocol} | Port: ${packet.dest_port} | Size: ${packet.size}B`, { size: 8 });
    addText(`   Threat: ${packet.threat_type || 'Unknown'} | Country: ${packet.country || 'Unknown'}`, { size: 8 });
    addText(`   Time: ${new Date(packet.captured_at).toLocaleString()}`, { size: 8 });
    yPosition += 2;
  });

  addText('STATISTICS & ANALYSIS', { size: 14, bold: true, color: [30, 58, 138] });
  addText(`Report Generated: ${new Date().toLocaleString()}`, { size: 9 });
  addText(`Total Data Points Analyzed: ${totalPackets + data.threats.length}`, { size: 9 });
  addText(`Detection Coverage: ${(uniqueThreats > 0 ? ((maliciousPackets / uniqueThreats) * 100).toFixed(2) : 0)}% avg per threat`, { size: 9 });

  const filename = `ThreatWatch_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
