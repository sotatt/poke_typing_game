const API_BASE = "http://localhost:8000"; // APIベースURL
const ZUKAN_TOTAL = 721; // ポケモン図鑑の総数
const GRAY_IMAGE = "images/zukan_rectangle.png"; // グレー画像

// ポケモンデータを取得
async function fetchPokemonData(id) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`); // ポケモンデータを取得
  return await res.json(); // ポケモンデータをJSON形式で返す
}

async function fetchCaptured() {
  const res = await fetch('http://127.0.0.1:8000/api/captured');
  return await res.json();
}

async function renderZukan() {
  const area = document.querySelector(".zukan-pokemon-area");
  area.innerHTML = "";

  // 全てグレーで描画
  for (let id = 1; id <= ZUKAN_TOTAL; id++) {
    const box = document.createElement("div");
    box.className = "zukan-pokemon-box uncaptured";
    box.setAttribute("data-poke-id", id);
    box.innerHTML = `
      <div class="zukan-pokemon-imgbox">
        <img src="${GRAY_IMAGE}" alt="?" />
      </div>
      <div class="zukan-pokemon-num">${String(id).padStart(3, "0")}</div>
    `;
    area.appendChild(box);
  }

  // 捕獲済みを取得し、上書き
  const captured = await fetchCaptured();
  const rate = document.querySelector(".result-completion-number");
  const percent = Math.floor((captured.length / ZUKAN_TOTAL) * 100);
  rate.textContent = percent;

  // 進捗バーの幅を更新
  const lineInner = document.querySelector(".result-completion__line-inner");
  if (lineInner) {
    lineInner.style.width = percent + "%";
  }

  for (const id of captured) {
    const poke = await fetchPokemonData(id);
    const box = area.querySelector(`.zukan-pokemon-box[data-poke-id='${id}']`);
    if (box) {
      box.classList.remove("uncaptured");
      box.innerHTML = `
        <div class="zukan-pokemon-imgbox" style="position:relative;">
          <img src="${poke.sprites.front_default}" alt="${poke.name}" style="position:relative; z-index:2; " />
          <div class="zukan-pokemon-num" style="position:absolute; z-index:1;">
            ${String(id).padStart(3, "0")}
          </div>
        </div>
      `;
      console.log("okっっk")
    }
  }
}
window.addEventListener("DOMContentLoaded", renderZukan);