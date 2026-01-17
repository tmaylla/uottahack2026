const analyzeBtn = document.getElementById("analyzeBtn");
    const inputContent = document.getElementById("inputContent");
    const resultCard = document.getElementById("resultCard");
    const historyList = document.getElementById("historyList");

    const history = [];

    analyzeBtn.addEventListener("click", () => {
        const content = inputContent.value.trim();
    });

    function renderHistory() {
      historyList.innerHTML = history.map(h => `
        <div class="bg-gray-800 p-2 rounded">
          <p class="text-sm mb-1">${h.content}</p>
          <p class="text-xs ${h.result==='safe'?'text-green-400':h.result==='suspicious'?'text-yellow-400':'text-red-400'}">
            ${h.result.toUpperCase()} • ${h.confidence}%
          </p>
        </div>
      `).join("");
    }