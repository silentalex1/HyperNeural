from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass
class ChartConfig:
    chart_type: str
    title: str
    x_axis: str
    y_axis: str
    data: list[dict[str, Any]]
    colors: list[str]


@dataclass
class ReportConfig:
    title: str
    sections: list[str]
    charts: list[ChartConfig]
    metrics: dict[str, float]
    summary: str


class VisualizationEngine:
    def __init__(self):
        self.charts: list[ChartConfig] = []
        self.reports: dict[str, ReportConfig] = {}
    
    def create_line_chart(self, title: str, x_data: list[Any], y_data: list[float], 
                        x_label: str = "X", y_label: str = "Y", color: str = "#3498db") -> ChartConfig:
        data = [{"x": x, "y": y} for x, y in zip(x_data, y_data)]
        
        chart = ChartConfig(
            chart_type="line",
            title=title,
            x_axis=x_label,
            y_axis=y_label,
            data=data,
            colors=[color]
        )
        
        self.charts.append(chart)
        return chart
    
    def create_bar_chart(self, title: str, categories: list[str], values: list[float],
                       x_label: str = "Category", y_label: str = "Value", color: str = "#e74c3c") -> ChartConfig:
        data = [{"category": cat, "value": val} for cat, val in zip(categories, values)]
        
        chart = ChartConfig(
            chart_type="bar",
            title=title,
            x_axis=x_label,
            y_axis=y_label,
            data=data,
            colors=[color]
        )
        
        self.charts.append(chart)
        return chart
    
    def create_scatter_plot(self, title: str, x_data: list[float], y_data: list[float],
                          x_label: str = "X", y_label: str = "Y", color: str = "#2ecc71") -> ChartConfig:
        data = [{"x": x, "y": y} for x, y in zip(x_data, y_data)]
        
        chart = ChartConfig(
            chart_type="scatter",
            title=title,
            x_axis=x_label,
            y_axis=y_label,
            data=data,
            colors=[color]
        )
        
        self.charts.append(chart)
        return chart
    
    def create_multi_line_chart(self, title: str, datasets: list[dict[str, Any]],
                               x_label: str = "X", y_label: str = "Y") -> ChartConfig:
        colors = ["#3498db", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6"]
        
        chart = ChartConfig(
            chart_type="multi_line",
            title=title,
            x_axis=x_label,
            y_axis=y_label,
            data=datasets,
            colors=colors[:len(datasets)]
        )
        
        self.charts.append(chart)
        return chart
    
    def create_heatmap(self, title: str, matrix: list[list[float]], 
                      x_labels: list[str], y_labels: list[str]) -> ChartConfig:
        data = []
        for i, row in enumerate(matrix):
            for j, value in enumerate(row):
                data.append({
                    "x": x_labels[j],
                    "y": y_labels[i],
                    "value": value
                })
        
        chart = ChartConfig(
            chart_type="heatmap",
            title=title,
            x_axis="X",
            y_axis="Y",
            data=data,
            colors=["#3498db"]
        )
        
        self.charts.append(chart)
        return chart
    
    def generate_training_report(self, training_history: list[dict[str, Any]], 
                                 final_metrics: dict[str, float]) -> ReportConfig:
        charts = []
        
        loss_data = [entry["loss"] for entry in training_history]
        epochs = list(range(1, len(loss_data) + 1))
        
        charts.append(self.create_line_chart(
            "Training Loss Over Time",
            epochs,
            loss_data,
            "Epoch",
            "Loss",
            "#e74c3c"
        ))
        
        if "accuracy" in training_history[0]:
            acc_data = [entry["accuracy"] for entry in training_history]
            charts.append(self.create_line_chart(
                "Training Accuracy Over Time",
                epochs,
                acc_data,
                "Epoch",
                "Accuracy",
                "#3498db"
            ))
        
        report = ReportConfig(
            title="Training Summary Report",
            sections=["Overview", "Metrics", "Charts", "Recommendations"],
            charts=charts,
            metrics=final_metrics,
            summary=self._generate_training_summary(training_history, final_metrics)
        )
        
        self.reports["training"] = report
        return report
    
    def _generate_training_summary(self, history: list[dict[str, Any]], metrics: dict[str, float]) -> str:
        initial_loss = history[0]["loss"]
        final_loss = history[-1]["loss"]
        loss_reduction = (initial_loss - final_loss) / initial_loss * 100
        
        summary = f"Training completed with {loss_reduction:.1f}% loss reduction. "
        
        if "accuracy" in metrics:
            summary += f"Final accuracy: {metrics['accuracy']:.2%}. "
        
        if loss_reduction > 50:
            summary += "Excellent training progress."
        elif loss_reduction > 30:
            summary += "Good training progress."
        else:
            summary += "Consider adjusting hyperparameters for better convergence."
        
        return summary
    
    def generate_model_comparison_report(self, models: dict[str, dict[str, float]]) -> ReportConfig:
        model_names = list(models.keys())
        accuracies = [models[name].get("accuracy", 0) for name in model_names]
        
        charts = [
            self.create_bar_chart(
                "Model Accuracy Comparison",
                model_names,
                accuracies,
                "Model",
                "Accuracy"
            )
        ]
        
        report = ReportConfig(
            title="Model Comparison Report",
            sections=["Overview", "Metrics", "Charts", "Recommendations"],
            charts=charts,
            metrics=models,
            summary=self._generate_comparison_summary(models)
        )
        
        self.reports["comparison"] = report
        return report
    
    def _generate_comparison_summary(self, models: dict[str, dict[str, float]]) -> str:
        best_model = max(models.keys(), key=lambda k: models[k].get("accuracy", 0))
        best_accuracy = models[best_model].get("accuracy", 0)
        
        return f"Best performing model: {best_model} with {best_accuracy:.2%} accuracy."
    
    def export_chart_html(self, chart: ChartConfig, output_path: Path) -> None:
        html_template = f"""<!DOCTYPE html>
<html>
<head>
    <title>{chart.title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <canvas id="chart"></canvas>
    <script>
        const ctx = document.getElementById('chart').getContext('2d');
        new Chart(ctx, {{
            type: '{chart.chart_type}',
            data: {{
                labels: {json.dumps([d.get('x', d.get('category', '')) for d in chart.data])},
                datasets: [{{
                    label: '{chart.title}',
                    data: {json.dumps([d.get('y', d.get('value', 0)) for d in chart.data])},
                    borderColor: '{chart.colors[0]}',
                    backgroundColor: '{chart.colors[0]}',
                    fill: false
                }}]
            }},
            options: {{
                responsive: true,
                scales: {{
                    x: {{ title: {{ display: true, text: '{chart.x_axis}' }} }},
                    y: {{ title: {{ display: true, text: '{chart.y_axis}' }} }}
                }}
            }}
        }});
    </script>
</body>
</html>"""
        
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open('w') as f:
            f.write(html_template)
    
    def export_report_html(self, report: ReportConfig, output_path: Path) -> None:
        html_template = f"""<!DOCTYPE html>
<html>
<head>
    <title>{report.title}</title>
    <style>
        body {{ font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }}
        .section {{ margin: 30px 0; }}
        .metrics {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }}
        .metric-card {{ background: #f5f5f5; padding: 20px; border-radius: 8px; }}
        .metric-value {{ font-size: 24px; font-weight: bold; color: #3498db; }}
        .summary {{ background: #e8f4f8; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db; }}
    </style>
</head>
<body>
    <h1>{report.title}</h1>
    
    <div class="summary">
        <h3>Summary</h3>
        <p>{report.summary}</p>
    </div>
    
    <div class="section">
        <h2>Metrics</h2>
        <div class="metrics">
"""
        
        for metric, value in report.metrics.items():
            html_template += f"""
            <div class="metric-card">
                <div>{metric}</div>
                <div class="metric-value">{value:.4f}</div>
            </div>"""
        
        html_template += """
        </div>
    </div>
    
    <div class="section">
        <h2>Charts</h2>
"""
        
        for i, chart in enumerate(report.charts):
            html_template += f"""
        <div>
            <h3>{chart.title}</h3>
            <canvas id="chart{i}"></canvas>
        </div>"""
        
        html_template += """
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
"""
        
        for i, chart in enumerate(report.charts):
            html_template += f"""
        new Chart(document.getElementById('chart{i}').getContext('2d'), {{
            type: '{chart.chart_type}',
            data: {{
                labels: {json.dumps([d.get('x', d.get('category', '')) for d in chart.data])},
                datasets: [{{
                    label: '{chart.title}',
                    data: {json.dumps([d.get('y', d.get('value', 0)) for d in chart.data])},
                    borderColor: '{chart.colors[0]}',
                    backgroundColor: '{chart.colors[0]}',
                    fill: false
                }}]
            }},
            options: {{
                responsive: true,
                scales: {{
                    x: {{ title: {{ display: true, text: '{chart.x_axis}' }} }},
                    y: {{ title: {{ display: true, text: '{chart.y_axis}' }} }}
                }}
            }}
        }});"""
        
        html_template += """
    </script>
</body>
</html>"""
        
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open('w') as f:
            f.write(html_template)
    
    def export_report_json(self, report: ReportConfig, output_path: Path) -> None:
        report_data = {
            "title": report.title,
            "sections": report.sections,
            "charts": [c.__dict__ for c in report.charts],
            "metrics": report.metrics,
            "summary": report.summary
        }
        
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open('w') as f:
            json.dump(report_data, f, indent=2)
