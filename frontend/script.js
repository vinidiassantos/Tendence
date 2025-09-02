function mostrarGrafico(tipo) {
  document.getElementById('chart').style.display = tipo === 'ibge' ? 'block' : 'none';
  document.getElementById('chart2').style.display = tipo === 'indicadores' ? 'block' : 'none';
  document.getElementById('chartInvestimento').style.display = tipo === 'investimento' ? 'block' : 'none';
  document.getElementById('chartComparativo').style.display = tipo === 'comparativo' ? 'block' : 'none';
}

function exportarGrafico() {
  const canvas = document.querySelector('canvas[style*="block"]');
  const link = document.createElement('a');
  link.download = 'grafico.png';
  link.href = canvas.toDataURL();
  link.click();
}

// 🔹 IBGE
fetch('/api/estados')
  .then(res => res.json())
  .then(data => {
    const estados = data.map(d => d.nome);
    const codigos = data.map(d => d.id);
    const ctx = document.getElementById('chart').getContext('2d');

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: estados,
        datasets: [{
          label: 'Código IBGE por Estado',
          data: codigos,
          backgroundColor: 'rgba(54, 162, 235, 0.6)'
        }]
      },
      options: { responsive: true }
    });

    // Resultado: média dos códigos IBGE
    const mediaIbge = codigos.reduce((a, b) => a + b, 0) / codigos.length;
    document.getElementById('resultadoIbge').textContent = mediaIbge.toFixed(2);
  });

// 🔹 Indicadores
fetch('/api/indicadores')
  .then(res => res.json())
  .then(data => {
    const select = document.getElementById('estadoSelect');
    [...new Set(data.map(d => d.estado))].forEach(estado => {
      const option = document.createElement('option');
      option.value = estado;
      option.textContent = estado;
      select.appendChild(option);
    });

    select.addEventListener('change', () => {
      const estado = select.value;
      const filtrado = estado === 'todos' ? data : data.filter(d => d.estado === estado);
      atualizarGraficoIndicadores(filtrado);
    });

    atualizarGraficoIndicadores(data);

    // Resultado: média da cobertura SUS
    const mediaCobertura = data.reduce((acc, d) => acc + d.cobertura_sus, 0) / data.length;
    document.getElementById('resultadoIndicadores').textContent = mediaCobertura.toFixed(1) + '%';
  });

function atualizarGraficoIndicadores(data) {
  const ctx = document.getElementById('chart2').getContext('2d');
  if (window.indicadoresChart) window.indicadoresChart.destroy();

  window.indicadoresChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: data.map(d => d.estado),
      datasets: [
        {
          label: 'Investimento (R$ milhões)',
          data: data.map(d => d.investimento_milhoes),
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)'
        },
        {
          label: 'Natalidade',
          data: data.map(d => d.natalidade),
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)'
        },
        {
          label: 'Mortalidade',
          data: data.map(d => d.mortalidade),
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          borderColor: 'rgba(255, 206, 86, 1)'
        },
        {
          label: 'Cobertura SUS',
          data: data.map(d => d.cobertura_sus),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)'
        }
      ]
    },
    options: { responsive: true, scales: { r: { beginAtZero: true } } }
  });
}

// 🔹 Investimento por Estado
fetch('/api/dados-integrados')
  .then(res => res.json())
  .then(data => {
    const estados = [...new Set(data.map(d => d.estado))];
    const anos = [...new Set(data.map(d => d.ano))];
    const datasets = estados.map(estado => ({
      label: estado,
      data: anos.map(ano => {
        const registro = data.find(d => d.estado === estado && d.ano === ano);
        return registro ? registro.investimento_total : 0;
      }),
      borderWidth: 2
    }));

    const ctx = document.getElementById('chartInvestimento').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: { labels: anos, datasets },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Investimento em Saúde por Estado' }
        }
      }
    });

    // Resultado: total investido
    const totalInvestido = data.reduce((acc, d) => acc + d.investimento_total, 0);
    document.getElementById('resultadoInvestimento').textContent = 'R$ ' + totalInvestido.toLocaleString('pt-BR');
  });

// 🔹 Comparativo Investimento vs Natalidade
fetch('/api/investimento-natalidade')
  .then(res => res.json())
  .then(data => {
    const estados = data.map(d => d.estado);
    const investimento = data.map(d => d.investimento_total);
    const natalidade = data.map(d => d.natalidade);
    const ctx = document.getElementById('chartComparativo').getContext('2d');

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: estados,
        datasets: [
          {
            label: 'Investimento Total',
            data: investimento,
            backgroundColor: 'rgba(75, 192, 192, 0.6)'
          },
          {
            label: 'Natalidade',
            data: natalidade,
            backgroundColor: 'rgba(255, 159, 64, 0.6)'
          }
        ]
      },
      options: { responsive: true }
    });

    // Resultado: correlação simples (não estatística)
    const somaInvestimento = investimento.reduce((a, b) => a + b, 0);
    const somaNatalidade = natalidade.reduce((a, b) => a + b, 0);
    const proporcao = somaNatalidade / somaInvestimento;
    document.getElementById('resultadoComparativo').textContent = proporcao.toFixed(4);
  });
