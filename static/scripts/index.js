async function updateGoldPrice() {
  const element = document.querySelector(".gold-price");
  element.textContent = "กำลังโหลด...";

  const selectedCurrency = document.querySelector('[name="currency"]').value;

  const goldPriceResponse = await fetch("/price", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      CURRENCY: selectedCurrency ?? "THB",
    }),
  });

  if (!goldPriceResponse.ok) return;

  const { GOLD_PRICE } = await goldPriceResponse.json();

  element.textContent = GOLD_PRICE.toFixed(2);
}

async function getCurrencies() {
  const select = document.querySelector('[name="currency"]');

  const response = await fetch("/currencies");

  if (!response.ok) return;

  const currencies = await response.json();

  let options = "";

  Object.entries(currencies).forEach(([value, name]) => {
    options += `<option value="${value}">${name}</option>`;
  });

  select.innerHTML = options;
  select.value = "THB";
}

window.addEventListener("DOMContentLoaded", () => {
  getCurrencies();
  updateGoldPrice();

  setInterval(updateGoldPrice, 300000);
});
