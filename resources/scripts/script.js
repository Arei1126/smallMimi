`use strict`
import * as IDB from "./module/idb.js"

const LANG = "ja";
const PITCH = 0.7;
const RATE = 0.35;
const BRIEFING0 = "こんにちは。僕は、聞き耳だよ。僕は退屈だから、阪大生の最新の暇つぶしの方法が知りたいなー。気になるから、教えてほしいなあ。";
const BRIEFING = "僕の耳に向かって、はっきりしゃべりかけてほしいな。どうぞ。";
const DEBRIEFING0 = "へー、そうなのかい、これで退屈しないかな。なんたって、耳だからね。";
const DEBRIEFING = "ありがとう。またねー";
const RESPONSE = "ほう";
const RECORDING_DUARATION = 30*1000; // (ms)

window.addEventListener("load", async ()=>{

	const guide = document.createElement("p");
	guide.innerText = "Tap or Click here to Start"
	document.body.appendChild(guide);

	const manager = document.querySelector("#manager");
	const downloadList = document.querySelector("#downloadList");

	window.addEventListener("click", await init);

	async function init() { 
		window.removeEventListener("click", init);
		guide.style.display = "none";

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
				const utter0 = new SpeechSynthesisUtterance();
				utter0.lang = LANG;
				utter0.pitch = PITCH;
				utter0.rate = RATE;
				utter0.text = BRIEFING0;

				Synth.speak(utter0);


				const utter = new SpeechSynthesisUtterance();
				utter.lang = LANG;
				utter.pitch = PITCH;
				utter.text = BRIEFING;
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
				console.warn("ブリーフィング");
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
						utter.text = RESPONSE;
						utter.rate = RATE;

						utter.addEventListener("end",()=>{});

						Synth.speak(utter);

					}
					else{
						console.warn("相槌");
					}
				}
			}

			Recognition.addEventListener("result", write);

			Recognition.addEventListener("end",endThenStart);

			function endThenStart() {
				if(Recording){
					// 誰も発声しなかったときの対策
					const now = new Date();
					if(now - StartTimeMs > 3*RECORDING_DUARATION){
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
				const utter0 = new SpeechSynthesisUtterance();
				utter0.lang = LANG;
				utter0.pitch = PITCH;
				utter0.text = DEBRIEFING0;
				utter0.rate = RATE;

				Synth.speak(utter0);
				
				const utter = new SpeechSynthesisUtterance();
				utter.lang = LANG;
				utter.pitch = PITCH;
				utter.text = DEBRIEFING;
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
				console.warn("デブリーフィング");	
				const ev = new CustomEvent("debriefingFinished",{
					detail: {}
				});
				Signal.dispatchEvent(ev);
			}
			
		};



	};
});
