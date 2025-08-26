window.addEventListener("DOMContentLoaded", main);

let page = 0;
let loadingData = false;

function main() {
  logsScroll();
  loadLogs(document.querySelector(".logs-container"));
}

function logsScroll() {
  const container = document.querySelector(".logs-container");

  container.addEventListener("scroll", () => {
    if (
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - 50
    ) {
      loadLogs(container);
    }
  });
}

async function loadLogs(container) {
  if (loadingData) return;
  loadingData = true;

  // Replace this with your API or data source
  const res = await fetch(`/fetchLogs?page=${page}`);
  const { logs } = await res.json();

  const html = logs
    .map((log) => {
      const date = new Date(Number(log.timestamp));
      const stringDate = date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",

        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      return `<div class="log glass-50">
        <p class="gold-price">ราคาทองคำ: ${Number(log.gold_price).toFixed(
          2
        )}$</p>
        <p class="timestamp">เวลา: ${stringDate}</p>
      </div>`;
    })
    .join("\n");

  page++;
  loadingData = false;

  container.innerHTML += logs.length > 0 ? html : "<p>ไม่พบข้อมูลใดๆ</p>";
}
