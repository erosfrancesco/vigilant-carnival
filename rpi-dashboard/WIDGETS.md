# Dashboard Widgets - Modular Data Visualization

A dashboard agora possui **widgets modulares** para visualizar dados em tempo real usando Chart.js.

## 📊 Widgets Disponíveis

### 1. **ValueDisplay** - Exibição de Valor Numérico

Exibe o valor atual com estatísticas (min, max, média).

```jsx
<ValueDisplay 
    label="Temperatura"
    value={25.5}
    unit="°C"
    min={15.2}
    max={28.3}
    avg={22.1}
/>
```

**Props:**
- `label` - Rótulo do widget
- `value` - Valor numérico atual
- `unit` - Unidade de medida (opcional)
- `min` - Valor mínimo (opcional)
- `max` - Valor máximo (opcional)
- `avg` - Valor médio (opcional)

---

### 2. **LineChartWidget** - Gráfico de Linhas

Exibe histórico de dados em um gráfico de linha interativo.

```jsx
<LineChartWidget
    label="Temperatura (Últimos 60s)"
    data={[20, 20.5, 21, 21.2, 20.8]}
    timestamps={["2024-04-20T12:00:00", "2024-04-20T12:00:02", ...]}
    color="#667eea"
    yMin={15}
    yMax={30}
    yLabel="°C"
/>
```

**Props:**
- `label` - Título do gráfico
- `data` - Array de valores numéricos
- `timestamps` - Array de timestamps ISO (mesmos índices que `data`)
- `color` - Cor da linha (hex)
- `yMin` - Valor mínimo do eixo Y (opcional)
- `yMax` - Valor máximo do eixo Y (opcional)
- `yLabel` - Rótulo da unidade de medida (opcional)

---

## 🔗 Integração com WebSocket

### Estrutura de Mensagem do Servidor

O servidor EnhancedWebSocket envia mensagens com dados de sensores:

```json
{
    "type": "state",
    "timestamp": "2024-04-20T12:34:56.789012",
    "gpio": {"17": true, "27": false, ...},
    "sensors": {
        "temperature": 23.5,
        "humidity": 65.2,
        "pressure": 1013.25
    },
    "serial": "dados_seriais"
}
```

### Usando Dados do WebSocket nos Widgets

**Exemplo: Pegar dados de temperatura do servidor**

```jsx
const [temperatureHistory, setTemperatureHistory] = useState([]);
const [timestamps, setTimestamps] = useState([]);
const [currentTemp, setCurrentTemp] = useState(0);

function connectWebSocket() {
    ws.current = new WebSocket(serverUrl);
    
    ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.sensors?.temperature) {
            setCurrentTemp(data.sensors.temperature);
            
            // Adicionar ao histórico (manter últimos 60 valores)
            setTemperatureHistory(prev => 
                [...prev, data.sensors.temperature].slice(-60)
            );
            setTimestamps(prev => 
                [...prev, data.timestamp].slice(-60)
            );
        }
    };
}

// Renderizar widget
<LineChartWidget
    label="Temperatura"
    data={temperatureHistory}
    timestamps={timestamps}
    color="#667eea"
    yMin={15}
    yMax={30}
    yLabel="°C"
/>
```

---

## 🚀 Servidor com Suporte a Sensores

Use `ws_server_sensors.py` para servidor com simulação de sensores:

```bash
cd server
python3 ws_server_sensors.py
```

**Dados Simulados:**
- Temperatura: 15-30°C
- Umidade: 30-90%
- Pressão: ±2 hPa

### Integrar Sensores Reais

Edit `ws_server_sensors.py` e substitua `read_sensors()`:

```python
def read_sensors() -> dict:
    """Ler sensores reais"""
    import Adafruit_DHT
    
    humidity, temperature = Adafruit_DHT.read_retry(
        Adafruit_DHT.DHT22, 
        pin=4
    )
    
    return {
        "temperature": temperature,
        "humidity": humidity,
        "pressure": 1013.25,  # ou ler de sensor BMP280
    }
```

---

## 📝 Exemplos de Uso

### Exemplo 1: Dashboard com Temperatura e Umidade

```jsx
function DashboardWithWidgets({ connected, sensors, history }) {
    const tempStats = calcStats(history.temperature);
    const humStats = calcStats(history.humidity);
    
    return (
        <>
            <div className="widget-section">
                <div className="widget-title">📊 Sensores</div>
                <div className="widgets-grid">
                    <ValueDisplay 
                        label="Temperatura"
                        value={sensors.temperature}
                        unit="°C"
                        min={tempStats.min}
                        max={tempStats.max}
                        avg={tempStats.avg}
                    />
                    <ValueDisplay 
                        label="Umidade"
                        value={sensors.humidity}
                        unit="%"
                        min={humStats.min}
                        max={humStats.max}
                        avg={humStats.avg}
                    />
                </div>
            </div>
            
            <div className="widget-section">
                <div className="widget-title">📈 Gráficos</div>
                <div className="widgets-grid">
                    <LineChartWidget
                        label="Temperatura (1 hora)"
                        data={history.temperature}
                        timestamps={history.timestamps}
                        color="#667eea"
                        yMin={15}
                        yMax={30}
                        yLabel="°C"
                    />
                    <LineChartWidget
                        label="Umidade (1 hora)"
                        data={history.humidity}
                        timestamps={history.timestamps}
                        color="#764ba2"
                        yMin={30}
                        yMax={90}
                        yLabel="%"
                    />
                </div>
            </div>
        </>
    );
}
```

### Exemplo 2: Sensor de Distância

```jsx
<ValueDisplay 
    label="Distância"
    value={distance}
    unit="cm"
/>

<LineChartWidget
    label="Histórico de Distância"
    data={distanceHistory}
    timestamps={timestamps}
    color="#4ade80"
    yMin={0}
    yMax={400}
    yLabel="cm"
/>
```

### Exemplo 3: Monitoramento de Pressão

```jsx
<ValueDisplay 
    label="Pressão"
    value={pressure}
    unit="hPa"
    min={pressureMin}
    max={pressureMax}
    avg={pressureAvg}
/>
```

---

## 🎨 Customização de Estilos

### Cores de Widgets

Os gridlayouts são responsivos. Customize as cores no CSS:

```css
/* Widget colors */
.value-number {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.chart-container canvas {
    /* Customizar aparência */
}
```

### Tamanhos

```css
.widgets-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    /* Ajustar minmax para alterar tamanho mínimo */
}

.chart-container {
    height: 400px;  /* Aumentar altura do gráfico */
}
```

---

## 📦 Dependências

- **Chart.js 4.4** - Via CDN (nenhuma instalação necessária)
- **React 18** - Já incluído na dashboard

Nenhuma dependência adicional necessária!

---

## 🔧 Troubleshooting

### Gráfico não aparece
- Verifique se dados estão sendo recebidos do servidor
- Confirme que `data` não está vazio
- Abra console (F12) para erros

### Dados não atualizam
- Confirme conexão WebSocket está ativa
- Verifique mensagens do servidor contêm `sensors`
- Aumente `UPDATE_INTERVAL` se CPU está alta

### Performance lenta
- Reduza histórico: `slice(-30)` em vez de `slice(-60)`
- Aumente UPDATE_INTERVAL: `2.0` em vez de `1.0`
- Desabilite gráficos não usados

---

## 📚 Próximas Etapas

1. **Integrar sensores reais** em `read_sensors()`
2. **Customizar cores** para aplicação
3. **Adicionar seus widgets** (gauge, progress bar, etc.)
4. **Exportar dados** para CSV/gráficos históricos
5. **Alertas** quando valores excedem limites

---

## 🚀 Performance

- **Histórico limitado**: Mantém apenas 60 últimos valores
- **Update eficiente**: Gráficos atualizam apenas quando necessário
- **Chart.js otimizado**: Renderização GPU acelerada
- **Memory safe**: Arrays descartam valores antigos automaticamente

**Resultado**: Funciona perfeitamente em Raspberry Pi Zero!

---

Para mais exemplos, veja `dashboard/index.html` e `server/ws_server_sensors.py`.
