document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector(".input-form__input");
  const typedSpan = document.querySelector(".input-form__text--typed");
  const remainingSpan = document.querySelector(".input-form__text--remaining");
  const kanaTypedSpan = document.querySelector(".input-form__text--kana .input-form__text--typed");
  const kanaRemainingSpan = document.querySelector(".input-form__text--kana .input-form__text--remaining");
  const background = document.querySelector(".input-form__background");
  const pokemonImage = document.getElementById("pokemonImage");
  const scoreElement = document.querySelector(".top-counter__score");
  const streakElement = document.querySelector(".streak-counter__number");

  // ゲーム状態の管理
  let currentPokemon = null;
  let timeLeft = 0;
  let timer = null;
  let score = 0;
  let streak = 0;
  let maxStreak = 0; // 最高連続記録
  let gameTimer = null;
  let totalCaughtPokemon = 0;

  // 難易度の取得と設定
  const difficulty = localStorage.getItem("selectedDifficulty") || "normal";
  const region = localStorage.getItem("selectedRegion") || "kanto";

  // 地域名→世代IDのマッピング
  const regionToGeneration = {
    kanto: 1,
    johto: 2,
    hoenn: 3,
    sinnoh: 4,
    unova: 5,
    kalos: 6
  };

  // 難易度設定
  const difficultySettings = {
    easy: {
      timeLimit: 15, // 1問あたりの制限時間（秒）
      gameTime: 15, // ゲーム全体の制限時間（秒）
    },
    normal: {
      timeLimit: 10,
      gameTime: 90,
    },
    hard: {
      timeLimit: 7,
      gameTime: 120,
    }
  };

  const settings = difficultySettings[difficulty];

  // ローマ字入力パーサークラス
  class RomanTypeParser {
    constructor(dictionary) {
      this.dictionary = dictionary;
      // パターン長でソート（長い順）
      this.dictionary.sort((a, b) => b.Pattern.length - a.Pattern.length);
    }

    // カタカナをローマ字に変換
    parseKana(kana) {
      const result = [];
      let i = 0;
      
      while (i < kana.length) {
        let matched = false;
        
        // 3文字、2文字、1文字の順でマッチング
        for (let len = Math.min(3, kana.length - i); len >= 1; len--) {
          const pattern = kana.substr(i, len);
          const entry = this.dictionary.find(d => d.Pattern === pattern);
          
          if (entry) {
            result.push({
              kana: pattern,
              romaji: entry.TypePattern,
              length: len
            });
            i += len;
            matched = true;
            break;
          }
        }
        
        if (!matched) {
          // マッチしない場合は1文字進める
          result.push({
            kana: kana[i],
            romaji: [kana[i]],
            length: 1
          });
          i++;
        }
      }
      
      return result;
    }

    // 入力が有効か判定
    isValidInput(parsedKana, input) {
      let inputIndex = 0;
      let kanaIndex = 0;
      
      while (kanaIndex < parsedKana.length && inputIndex < input.length) {
        const kanaEntry = parsedKana[kanaIndex];
        const romajiPatterns = kanaEntry.romaji;
        
        // このカタカナのローマ字パターンとマッチするかチェック
        let matched = false;
        for (const pattern of romajiPatterns) {
          const remainingInput = input.substr(inputIndex);
          if (remainingInput.startsWith(pattern.toUpperCase())) {
            inputIndex += pattern.length;
            kanaIndex++;
            matched = true;
            break;
          }
        }
        
        if (!matched) {
          // パターンの途中かチェック
          for (const pattern of romajiPatterns) {
            const patternUpper = pattern.toUpperCase();
            const remainingInput = input.substr(inputIndex);
            if (patternUpper.startsWith(remainingInput)) {
              return true; // 途中まで入力されている
            }
          }
          return false; // 無効な入力
        }
      }
      
      return inputIndex === input.length;
    }

    // 完全なローマ字文字列を生成
    generateRomaji(parsedKana) {
      return parsedKana.map(entry => entry.romaji[0]).join('').toUpperCase();
    }
  }

  // パーサーの初期化
  const parser = new RomanTypeParser(romanTypingDictionary);

  // ゲーム全体のタイマー開始
  function startGameTimer() {
    let gameTimeLeft = settings.gameTime;
    
    gameTimer = setInterval(() => {
      gameTimeLeft--;
      
      if (gameTimeLeft <= 0) {
        clearInterval(gameTimer);
        endGame();
      }
    }, 1000);
  }

  // タイマー開始
  function startTimer() {
    background.classList.add("input-form__background--time-progress");
    timeLeft = settings.timeLimit;
    let progress = 0;

    timer = setInterval(() => {
      timeLeft--;
      progress = ((settings.timeLimit - timeLeft) / settings.timeLimit) * 100;

      if (timeLeft <= 0) {
        clearInterval(timer);
        background.style.setProperty("--progress", "100%");
        handleTimeUp();
      } else {
        background.style.setProperty("--progress", `${progress}%`);
      }
    }, 1000);
  }

  // 時間切れの処理
  function handleTimeUp() {
    streak = 0;
    streakElement.textContent = streak;
    loadNextPokemon();
  }

  // 正解時の処理
  function handleCorrect() {
    clearInterval(timer);
    score += 100 + (streak * 10); // コンボボーナス
    streak++;
    
    // 最高連続記録の更新
    if (streak > maxStreak) maxStreak = streak;
    totalCaughtPokemon++;
    scoreElement.textContent = score;
    streakElement.textContent = streak;

    // 捕獲APIに送信
    if (currentPokemon && currentPokemon.id) {
      fetch('http://127.0.0.1:8000/api/captured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pokemon_id: currentPokemon.id })
      })
      .then(res => res.json())
      .then(data => {
        // 図鑑進捗のUI更新
        //fetchCaptured();
      });
    }
    loadNextPokemon();
  }

  // 間違い時の処理
  function handleMistake() {
    streak = 0;
    streakElement.textContent = streak;
    // 間違えた場合は次のポケモンに進まない（同じポケモンを続ける）
  }

  // ゲーム終了時の処理
  function endGame() {
    clearInterval(timer);
    clearInterval(gameTimer);
    
    // リザルトデータの保存
    localStorage.setItem("gameResult", JSON.stringify({
      score: score,
      maxStreak: maxStreak,
      currentStreak: streak,
      totalCaught: totalCaughtPokemon,
      difficulty: difficulty,
      region: region
    }));
    
    // リザルト画面へ遷移
    window.location.href = "result.html";
  }

  function handleInput(e) {
    if (!currentPokemon) return;

    let inputValue = e.target.value.toUpperCase();
    let prevValue = typedSpan.textContent || "";

    // 入力が増えた場合のみ判定
    if (inputValue.length > prevValue.length) {
      let nextChar = inputValue[inputValue.length - 1];
      let validChars = /^[A-Z0-9\-]$/;
      
      if (!validChars.test(nextChar)) {
        // 不正な文字は元に戻す
        e.target.value = prevValue;
        return;
      }

      // パーサーで入力判定
      const parsedKana = parser.parseKana(currentPokemon.kana);
      const isValid = parser.isValidInput(parsedKana, inputValue);
      
      if (isValid) {
        // 有効な入力
        typedSpan.textContent = inputValue;
        remainingSpan.textContent = currentPokemon.name.slice(inputValue.length);
        
        // カタカナの表示更新
        updateKanaDisplay(inputValue, parsedKana);
        
        // 正解判定
        if (inputValue === currentPokemon.name) {
          handleCorrect();
        }
      } else {
        // 無効な入力は元に戻し、連続記録をリセット
        e.target.value = prevValue;
        handleMistake();
      }
    } else {
      // バックスペースなどは許可
      typedSpan.textContent = inputValue;
      remainingSpan.textContent = currentPokemon.name.slice(inputValue.length);
      
      // カタカナの表示更新
      const parsedKana = parser.parseKana(currentPokemon.kana);
      updateKanaDisplay(inputValue, parsedKana);
    }
  }

  // カタカナ表示の更新
  function updateKanaDisplay(inputValue, parsedKana) {
    let inputIndex = 0;
    let typedKana = "";
    let remainingKana = currentPokemon.kana;
    
    for (const entry of parsedKana) {
      const romajiPattern = entry.romaji[0].toUpperCase();
      
      if (inputIndex + romajiPattern.length <= inputValue.length) {
        // このカタカナは入力済み
        typedKana += entry.kana;
        remainingKana = remainingKana.slice(entry.kana.length);
        inputIndex += romajiPattern.length;
      } else {
        // このカタカナは未入力
        break;
      }
    }
    
    kanaTypedSpan.textContent = typedKana;
    kanaRemainingSpan.textContent = remainingKana;
  }

  // 次のポケモンを読み込む
  function loadNextPokemon() {
    const generationId = regionToGeneration[region];
  
    // まず世代ごとのポケモンリストを取得
    fetch(`https://pokeapi.co/api/v2/generation/${generationId}/`)
      .then(response => response.json())
      .then(data => {
        // ポケモンリストからランダムに1匹選ぶ
        const speciesList = data.pokemon_species;
        const randomIndex = Math.floor(Math.random() * speciesList.length);
        const species = speciesList[randomIndex];
  
        // ポケモンの詳細情報を取得
        return fetch(species.url);
      })
      .then(response => response.json())
      .then(speciesData => {
        // 日本語名取得
        const jpNameObj = speciesData.names.find(n => n.language.name === 'ja-Hrkt');
        const jpName = jpNameObj ? jpNameObj.name : speciesData.name;

        // カタカナ名
        const katakanaName = wanakana.toKatakana(jpName);
        
        // パーサーでローマ字変換
        const parsedKana = parser.parseKana(katakanaName);
        const romajiName = parser.generateRomaji(parsedKana);

        // ポケモンIDから画像取得
        const pokeId = speciesData.id;
        const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokeId}.png`;

        currentPokemon = {
          id: pokeId,
          name: romajiName,
          kana: katakanaName,
          image: imageUrl
        };

        // 画面の更新
        pokemonImage.src = currentPokemon.image;
        remainingSpan.textContent = currentPokemon.name;
        kanaRemainingSpan.textContent = currentPokemon.kana;
        typedSpan.textContent = '';
        kanaTypedSpan.textContent = '';
        input.value = '';

        // タイマーの開始
        if (timer) clearInterval(timer);
        startTimer();
        input.focus();
      })
      .catch(error => {
        console.error('ポケモンデータの取得に失敗しました:', error);
      });
  }

  // イベントリスナーの設定
  input.addEventListener("input", handleInput);

  // ゲーム開始
  startGameTimer();
  loadNextPokemon();
});