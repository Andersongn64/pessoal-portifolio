import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3000/api';

export default function App() {
  const [contactId, setContactId] = useState('');
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!contactId) {
      setSummary(null);
      setHistory(null);
      setError(null);
      return;
    }

    async function fetchData() {
      setError(null);
      setLoadingSummary(true);
      setLoadingHistory(true);

      try {
        // Buscar resumo do cliente
        const resSummary = await fetch(`${API_BASE}/client-summary/${contactId}`);
        if (!resSummary.ok) throw new Error('Erro ao buscar resumo do cliente');
        const summaryData = await resSummary.json();
        setSummary(summaryData);
      } catch (e) {
        setSummary(null);
        setError(e.message);
      } finally {
        setLoadingSummary(false);
      }

      try {
        // Buscar histórico
        const resHistory = await fetch(`${API_BASE}/client-history/${contactId}`);
        if (!resHistory.ok) throw new Error('Erro ao buscar histórico do cliente');
        const historyData = await resHistory.json();
        setHistory(historyData);
      } catch (e) {
        setHistory(null);
        setError((prev) => prev ? prev + ' | ' + e.message : e.message);
      } finally {
        setLoadingHistory(false);
      }
    }

    fetchData();
  }, [contactId]);

  return (
    <div style={{ maxWidth: 700, margin: 'auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Dashboard de Atendimento</h1>

      <input
        type="text"
        placeholder="Digite Contact ID e pressione Enter"
        value={contactId}
        onChange={(e) => setContactId(e.target.value.trim())}
        onKeyDown={e => { if (e.key === 'Enter') setContactId(e.target.value.trim()); }}
        style={{
          width: '100%',
          padding: 10,
          fontSize: 16,
          marginBottom: 20,
          boxSizing: 'border-box'
        }}
      />

      {error && (
        <div style={{ color: 'red', marginBottom: 20 }}>
          {error}
        </div>
      )}

      <section style={{ marginBottom: 30 }}>
        <h2>Resumo do Cliente</h2>
        {loadingSummary && <p>Carregando resumo...</p>}
        {!loadingSummary && summary && (
          <div style={{
            background: '#f5f5f5',
            padding: 15,
            borderRadius: 6,
            boxShadow: '0 0 5px rgba(0,0,0,0.1)'
          }}>
            <p><strong>Sentimento:</strong> {summary.sentiment}</p>
            <p><strong>Pontuação:</strong> {summary.score}</p>
            <p><strong>Dicas:</strong> {summary.dica}</p>
            <p><strong>Tags:</strong> {summary.tags.join(', ')}</p>
          </div>
        )}
        {!loadingSummary && !summary && !error && <p>Digite um Contact ID para ver o resumo.</p>}
      </section>

      <section>
        <h2>Histórico de Interações</h2>
        {loadingHistory && <p>Carregando histórico...</p>}
        {!loadingHistory && history && history.length > 0 && (
          <ul style={{ maxHeight: 300, overflowY: 'auto', padding: 0, listStyle: 'none' }}>
            {history.map(log => (
              <li key={log._id} style={{ padding: 10, borderBottom: '1px solid #ddd' }}>
                <p><strong>Data:</strong> {new Date(log.timestamp).toLocaleString()}</p>
                <p><strong>Sentimento:</strong> {log.sentiment}</p>
                <p><strong>Pontuação:</strong> {log.score}</p>
                <p><strong>Tags:</strong> {log.tags.join(', ')}</p>
                <p><strong>Transcrição:</strong> {log.transcript}</p>
              </li>
            ))}
          </ul>
        )}
        {!loadingHistory && (!history || history.length === 0) && <p>Nenhuma interação encontrada.</p>}
      </section>
    </div>
  );
}
