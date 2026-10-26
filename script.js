
"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const searchInput = $("#searchInput");
const toolCards = $$(".tool-card");
const categories = $$(".category");
const emptyState = $("#emptyState");
const toolCount = $("#toolCount");

let selectedCategory = "todas";
let currentResult = null;

$("#year").textContent = new Date().getFullYear();

const toolDefinitions = {
    porcentaje: {
        title: "Calculadora de porcentajes",
        description: "Calcula qué porcentaje representa una cantidad.",
        fields: [
            {
                id: "percent",
                label: "Porcentaje (%)",
                placeholder: "Ej. 25",
                value: "25"
            },
            {
                id: "base",
                label: "Cantidad total",
                placeholder: "Ej. 200",
                value: "200"
            }
        ],
        calculate(values) {
            const result = values.percent / 100 * values.base;

            return {
                value: formatNumber(result),
                description: `${formatNumber(values.percent)}% de ${formatNumber(values.base)} es ${formatNumber(result)}.`,
                copy: String(result)
            };
        }
    },

    descuento: {
        title: "Calculadora de descuentos",
        description: "Calcula el ahorro y el precio final de una oferta.",
        fields: [
            {
                id: "price",
                label: "Precio original ($)",
                placeholder: "Ej. 100",
                value: "100"
            },
            {
                id: "discount",
                label: "Descuento (%)",
                placeholder: "Ej. 20",
                value: "20"
            }
        ],
        calculate(values) {
            const saving = values.price * values.discount / 100;
            const finalPrice = values.price - saving;

            return {
                value: `$${formatNumber(finalPrice)}`,
                description: `Ahorras $${formatNumber(saving)}. Precio original: $${formatNumber(values.price)}.`,
                copy: String(finalPrice)
            };
        }
    },

    temperatura: {
        title: "Conversor de temperatura",
        description: "Convierte temperaturas entre Celsius y Fahrenheit.",
        fields: [
            {
                id: "temperature",
                label: "Temperatura",
                placeholder: "Ej. 25",
                value: "25"
            }
        ],
        extra: `
            <div class="form-group">
                <label for="tempDirection">Convertir de</label>
                <select id="tempDirection">
                    <option value="c-f">Celsius a Fahrenheit</option>
                    <option value="f-c">Fahrenheit a Celsius</option>
                </select>
            </div>
        `,
        calculate(values) {
            const direction = $("#tempDirection").value;

            const result = direction === "c-f"
                ? values.temperature * 9 / 5 + 32
                : (values.temperature - 32) * 5 / 9;

            const from = direction === "c-f" ? "°C" : "°F";
            const to = direction === "c-f" ? "°F" : "°C";

            return {
                value: `${formatNumber(result)} ${to}`,
                description: `${formatNumber(values.temperature)} ${from} equivalen a ${formatNumber(result)} ${to}.`,
                copy: `${result} ${to}`
            };
        }
    },

    distancia: {
        title: "Conversor de distancia",
        description: "Convierte kilómetros y millas en ambas direcciones.",
        fields: [
            {
                id: "distance",
                label: "Distancia",
                placeholder: "Ej. 10",
                value: "10"
            }
        ],
        extra: `
            <div class="form-group">
                <label for="distanceDirection">Convertir de</label>
                <select id="distanceDirection">
                    <option value="km-mi">Kilómetros a millas</option>
                    <option value="mi-km">Millas a kilómetros</option>
                </select>
            </div>
        `,
        calculate(values) {
            const direction = $("#distanceDirection").value;
            const result = direction === "km-mi"
                ? values.distance / 1.609344
                : values.distance * 1.609344;

            const from = direction === "km-mi" ? "km" : "mi";
            const to = direction === "km-mi" ? "mi" : "km";

            return {
                value: `${formatNumber(result)} ${to}`,
                description: `${formatNumber(values.distance)} ${from} equivalen a ${formatNumber(result)} ${to}.`,
                copy: `${result} ${to}`
            };
        }
    },

    iva: {
        title: "Calculadora de IVA",
        description: "Calcula el impuesto y el precio total según la tarifa seleccionada.",
        fields: [
            {
                id: "subtotal",
                label: "Precio antes de IVA ($)",
                placeholder: "Ej. 100",
                value: "100"
            }
        ],
        extra: `
            <div class="form-group">
                <label for="ivaRate">Tarifa de IVA (%)</label>
                <select id="ivaRate">
                    <option value="15">15%</option>
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="8">8%</option>
                    <option value="custom">Otra tarifa</option>
                </select>
            </div>
            <div class="form-group" id="customRateGroup" hidden>
                <label for="customRate">Tarifa personalizada (%)</label>
                <input id="customRate" type="number" min="0" max="100"
                    step="any" value="12" placeholder="Ej. 12">
            </div>
        `,
        calculate(values) {
            const rateChoice = $("#ivaRate").value;
            const rate = rateChoice === "custom"
                ? readNumber($("#customRate").value)
                : Number(rateChoice);

            if (rate === null || rate < 0 || rate > 100) {
                throw new Error("Introduce una tarifa de IVA entre 0 y 100.");
            }

            const tax = values.subtotal * rate / 100;
            const total = values.subtotal + tax;

            return {
                value: `$${formatNumber(total)}`,
                description: `IVA (${formatNumber(rate)}%): $${formatNumber(tax)}. Subtotal: $${formatNumber(values.subtotal)}.`,
                copy: String(total)
            };
        }
    }
};

function formatNumber(number) {
    return new Intl.NumberFormat("es-EC", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6
    }).format(number);
}

function readNumber(value) {
    if (typeof value !== "string" || value.trim() === "") {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : null;
}

function setResult(result) {
    currentResult = result.copy;

    $("#resultValue").textContent = result.value;
    $("#resultDescription").textContent = result.description;
    $("#copyResult").disabled = false;
    $("#copyFeedback").textContent = "";
}

function showError(message) {
    currentResult = null;
    $("#resultValue").textContent = "Revisa los datos";
    $("#resultDescription").textContent = message;
    $("#copyResult").disabled = true;
    $("#copyFeedback").textContent = "";
}

function resetResult() {
    currentResult = null;
    $("#resultValue").textContent = "—";
    $("#resultDescription").textContent =
        "Introduce los valores y calcula para ver el resultado.";
    $("#copyResult").disabled = true;
    $("#copyFeedback").textContent = "";
}

function renderCalculator(toolKey) {
    const tool = toolDefinitions[toolKey];

    if (!tool) {
        return;
    }

    $("#calculatorTitle").textContent = tool.title;
    $("#calculatorDescription").textContent = tool.description;

    const form = $("#calculatorForm");

    form.innerHTML = `
        ${tool.fields.map(field => `
            <div class="form-group">
                <label for="${field.id}">${field.label}</label>
                <input
                    id="${field.id}"
                    type="number"
                    step="any"
                    inputmode="decimal"
                    placeholder="${field.placeholder}"
                    value="${field.value}"
                    required
                >
            </div>
        `).join("")}
        ${tool.extra || ""}
        <button type="button" class="calculate-button" id="calculateButton">
            Calcular resultado
        </button>
    `;

    resetResult();

    const calculateButton = $("#calculateButton");

    calculateButton.addEventListener("click", () => {
        try {
            const values = {};

            for (const field of tool.fields) {
                const input = document.getElementById(field.id);
                const value = readNumber(input.value);

                if (value === null) {
                    input.focus();
                    throw new Error(`Introduce un valor válido en "${field.label}".`);
                }

                if (field.id === "price" || field.id === "discount" ||
                    field.id === "subtotal" || field.id === "base") {
                    if (value < 0) {
                        input.focus();
                        throw new Error("Para este cálculo, los valores no pueden ser negativos.");
                    }
                }

                if (field.id === "discount" && value > 100) {
                    input.focus();
                    throw new Error("El descuento debe estar entre 0 y 100%.");
                }

                values[field.id] = value;
            }

            const result = tool.calculate(values);
            setResult(result);
        } catch (error) {
            showError(error.message || "No se pudo realizar el cálculo.");
        }
    });

    const ivaRate = $("#ivaRate");

    if (ivaRate) {
        ivaRate.addEventListener("change", () => {
            const customGroup = $("#customRateGroup");
            customGroup.hidden = ivaRate.value !== "custom";
        });
    }

    form.querySelectorAll("input, select").forEach(input => {
        input.addEventListener("input", resetResult);
        input.addEventListener("change", resetResult);
    });
}

function filterTools() {
    const query = searchInput.value
        .trim()
        .toLocaleLowerCase("es");

    let visible = 0;

    toolCards.forEach(card => {
        const searchableText = (
            card.dataset.search + " " + card.textContent
        ).toLocaleLowerCase("es");

        const matchesQuery = searchableText.includes(query);
        const matchesCategory = selectedCategory === "todas" ||
            card.dataset.category === selectedCategory;

        const show = matchesQuery && matchesCategory;

        card.hidden = !show;

        if (show) {
            visible++;
        }
    });

    emptyState.hidden = visible !== 0;
    toolCount.textContent = `${visible} ${visible === 1 ? "herramienta" : "herramientas"}`;
}

searchInput.addEventListener("input", filterTools);

categories.forEach(button => {
    button.addEventListener("click", () => {
        selectedCategory = button.dataset.category;

        categories.forEach(category => {
            const isActive = category === button;
            category.classList.toggle("active", isActive);
            category.setAttribute("aria-pressed", String(isActive));
        });

        filterTools();
    });

    button.setAttribute(
        "aria-pressed",
        String(button.classList.contains("active"))
    );
});

$$("[data-open]").forEach(button => {
    button.addEventListener("click", () => {
        renderCalculator(button.dataset.open);

        $("#calculadora").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
});

$("#copyResult").addEventListener("click", async () => {
    if (currentResult === null) {
        return;
    }

    try {
        await navigator.clipboard.writeText(currentResult);
        $("#copyFeedback").textContent = "Resultado copiado.";
    } catch {
        $("#copyFeedback").textContent =
            "No se pudo copiar automáticamente. Selecciona el resultado para copiarlo.";
    }
});

filterTools();
