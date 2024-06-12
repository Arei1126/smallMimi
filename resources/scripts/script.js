`use strict`
import * as IDB from "./module/idb.js"

const LANG = "ja";
const PITCH = 0.7;
const RATE = 0.4;

const BRIEFING = "僕の耳に向かって、はっきりしゃべりかけてほしいな。どうぞ。";
const DEBRIEFING = "ありがとう。またねー";
const RESPONSE = "ほう";

const RECORDING_DUARATION = 30*1000; // (ms)

let Situations = [];

let SelectedSituation;

class situation {
	constructor(name,brief, res, debrief){
		this.name = name;
		this.briefing = brief;
		this.response = res;
		this.debriefing = debrief;
		this.option = null;
	}
}

let stDefault = new situation("デフォルト","人間の声が聞こえるぞ。そうだ、そこの人間に質問だ。お前の夢は何だ。耳に向かって話しかけてくれ。さーん、にーい、いーち、どうぞ。","うん","ありがとう、人間。またね。");
Situations.push(stDefault);
let stSaka = new situation("阪大坂","人間の声が聞こえるぞ。そうだ、阪大坂にいる人間に質問だ。お前はこれから何をする予定なんだ？耳に向かって話しかけてくれ。さーん、にーい、いーち、どうぞ。","うん","ありがとう、人間。またね。");
Situations.push(stSaka);
let stLafore = new situation("ラフォレ","人間の声が聞こえるぞ。そうだ、ラフォレに向かう人間に質問だ。お前は今日はどんなものを食べるんだ？耳に向かって話かけてくれ。さーん、にーい、いーち、どうぞ。","うん","ありがとう。人間、またね。");
Situations.push(stLafore);
let stLibrary = new situation("図書館","人間の声が聞こえるぞ。そうだ、図書館に来た人間に質問だ。お前は今日は、何をしに図書館に来たんだ？耳に向かって話しかけてくれ。さーん、にーい、いーち、どうぞ。","うん","ありがとう、人間。またね。");
Situations.push(stLibrary);
let stNamiko = new situation("浪高庭園","人間の声が聞こえるぞ。そうだ、そこにいる人間に質問だ。お前は、暇なとき何をしているんだ。耳に向かって話しかけてくれ。さーん、にーい、いーち、どうぞ。","うん","ありがとう、人間。またね。");
Situations.push(stNamiko);
let stMain = new situation("メインストリート","人間の声が聞こえるぞ。そうだ、そこにいる人間に質問だ。お前は、暇なとき何をしているんだ。耳に向かって話しかけてくれ。さーん、にーい、いーち、どうぞ。","うん","ありがとう、人間。またね。");
Situations.push(stMain);
let stShop = new situation("浪高庭園","人間の声が聞こえるぞ。そうだ、そこにいる人間に質問だ。この商店街のおすすめの店を教えてほしい。耳に向かって話しかけてくれ。さん、にい、いち、どうぞ。","うん","ありがとう、人間。またね。");
Situations.push(stShop);

window.addEventListener("load", async ()=>{

	const guide = document.createElement("p");
	guide.innerText = "Tap or Click here to Start"
	document.body.appendChild(guide);

	const manager = document.querySelector("#manager");
	const downloadList = document.querySelector("#downloadList");
	const situationSelect = document.querySelector("#situationSelect");
	const close = document.querySelector("#close");


	

	window.addEventListener("click", await init);

	async function init() { 
		window.removeEventListener("click", init);
		guide.style.display = "none";

		for(const st of Situations){
			const option = document.createElement("option");
			option.value = st.name;
			option.innerText = st.name;
			st.option = option;
			situationSelect.appendChild(option); 
		}
		close.addEventListener("click", ()=>{
			for(const st of Situations){
				if(st.option.selected){
					SelectedSituation = st;
				}
			}
			return;
		});
		manager.showModal();
		IDB.downloadAllCSV(downloadList);

		// Setup
		
		const date = new Date();
		const sessionId = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;

		IDB.createNewDb(sessionId);

		const Synth = window.speechSynthesis;
		let Voices = Synth.getVoices();

		Synth.addEventListener("voiceschanged", ()=>{
			Voices = Synth.getVoices();
			console.info(Voices);
		});

		//const recognition = new SpeechRecognition();
		const Recognition = new webkitSpeechRecognition();

//////////////////////////////////
		Recognition.addEventListener("audiostart",()=>{
			console.log("audiostart");

		});

		Recognition.addEventListener("audioend",()=>{
			console.log("audioend");

		});


		Recognition.addEventListener("end",()=>{
			console.log("end");

		});

		Recognition.addEventListener("nomatch",()=>{
			console.log("nomatch");

		});

		Recognition.addEventListener("soundend",()=>{
			console.log("soundend");

		});

		Recognition.addEventListener("speechstart",()=>{
			console.log("speechstart");

		});

		Recognition.addEventListener("speechend",()=>{
			console.log("speechend");
		});

//////////////////////////////////



		Recognition.lang = LANG;
		//recognition.continuous = true;
		Recognition.intermResult = true;	
		Recognition.addEventListener("error",()=>{
				Recognition.stop();
			});

		// End of initialization

		const Signal = document.createElement("div");

		const rec = document.querySelector("#rec");

		const startButton = document.querySelector("#startButton");

		startButton.onpointerdown = () => {
			const audio = document.createElement("audio");
			audio.src = "resources/sound/wall_switch.mp3";
			audio.play();
		};
	
		startButton.onpointerup = () => {
			const audio = document.createElement("audio");
			audio.src = "resources/sound/wall_switch_reverse.mp3";
			audio.play();
		};

		Signal.addEventListener("debriefingFinished", ()=>{
		//	startButton.style.display = "block";
			startButton.addEventListener("pointerup", start);
		});

		Signal.addEventListener("briefingFinished",  await record);
		Signal.addEventListener("recordingFinished", await debrief);

		startButton.addEventListener("pointerup", start);

		async function start() {
			//startButton.style.display = "none";
			startButton.removeEventListener("pointerup",start);
			console.log("user start");
			await brief();
		}



		async function brief(){
			if(Voices.length !== 0){
				const utter = new SpeechSynthesisUtterance();
				utter.lang = LANG;
				utter.pitch = PITCH;
				utter.text = SelectedSituation.briefing;
				utter.rate = RATE;
				
				utter.addEventListener("end",()=>{
					const ev = new CustomEvent("briefingFinished",{
						detail: {}
					});
					Signal.dispatchEvent(ev);
				});

				Synth.speak(utter);

			}
			else{
				console.warn(SelectedSituation.briefing);
				const ev = new CustomEvent("briefingFinished",{
					detail: {}
				});
				Signal.dispatchEvent(ev);
			}
		}

		async function record() {
			rec.className = "blinking-text";

			let Recording = true;

			let DataArray = [];

			const StartTimeMs = window.Date.now();  // (ms)
			
			const date = new Date;
			const userId = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
			

			const write =  async (e) => {
				console.log("writing start");
				const timeMs = window.Date.now();
				const text = e.results[0][0].transcript;
				const date = new Date;
				const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

				if(timeMs - StartTimeMs >= RECORDING_DUARATION){	// 録音終了
					console.log("last writing");
					Recording = false;

					const data = {"sessionID": sessionId, "userID": userId, "recordID": time, "text": text};
					DataArray.push(data);

					// save data
					IDB.write(sessionId, DataArray);

					rec.className = "notrec";

					//  end process
					Recognition.removeEventListener("result",write);
					const ev = new CustomEvent("recordingFinished",{
						detail: {}
					});
					Signal.dispatchEvent(ev);

				}else{		// 続ける
					console.log("continue writing");
					const data = {"sessionID": sessionId, "userID": userId, "recordID": time, "text": text};
					DataArray.push(data);
					// ここに相槌をいれる
					if(Voices.length !== 0){
						const utter = new SpeechSynthesisUtterance();
						utter.lang = LANG;
						utter.pitch = PITCH;
						utter.text = SelectedSituation.response;
						utter.rate = RATE;

						utter.addEventListener("end",()=>{});

						Synth.speak(utter);

					}
					else{
						console.warn(SelectedSituation.response);
					}
				}
			}

			Recognition.addEventListener("result", write);

			Recognition.addEventListener("end",endThenStart);

			function endThenStart() {
				if(Recording){
					// 誰も発声しなかったときの対策
					const now = new Date();
					if(now - StartTimeMs > 1.5*RECORDING_DUARATION){
						Recording = false;

						// save data
						IDB.write(sessionId, DataArray);


						//  end process
						Recognition.removeEventListener("result",write);
						const ev = new CustomEvent("recordingFinished",{
							detail: {}
						});
						Signal.dispatchEvent(ev);
						console.log("反応なしタイムアウト");
						rec.className = "notrec";
						return;
					}
					console.log("continuing");
					Recognition.start();
				}
			}


			console.log("starting user record");
			Recognition.start();




		};

		async function debrief(){	
			console.log("debriefing...");

			if(Voices.length !== 0){	
				const utter = new SpeechSynthesisUtterance();
				utter.lang = LANG;
				utter.pitch = PITCH;
				utter.text = SelectedSituation.debriefing;
				utter.rate = RATE;
				
				utter.addEventListener("end",()=>{
					const ev = new CustomEvent("debriefingFinished",{
						detail: {}
					});
					Signal.dispatchEvent(ev);
				});

				Synth.speak(utter);

			}
			else{
				console.warn(SelectedSituation.debriefing);	
				const ev = new CustomEvent("debriefingFinished",{
					detail: {}
				});
				Signal.dispatchEvent(ev);
			}
			
		};



	};
});
