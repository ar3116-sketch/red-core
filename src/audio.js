// Procedural suit and bunker audio. Starts only after the player presses AUDIO.
export class BunkerAudio {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.nextBeat = 0;
    this.nextGeiger = 0;
    this.breathPhase = 0;
    this.nextStep=0;this.nextDrip=0;this.nextAlarm=0;this.alarmId='normal';
    this.coarsePointer = matchMedia('(pointer:coarse)');
  }

  async toggle() {
    if (!this.ctx) this.start();
    if (!this.ctx) return false;
    await this.ctx.resume();
    this.enabled = !this.enabled;
    this.master.gain.setTargetAtTime(this.enabled ? 0.45 : 0, this.ctx.currentTime, .04);
    if (this.enabled) {
      this.nextBeat = this.ctx.currentTime + .12;
      this.nextGeiger = this.ctx.currentTime + .5;
    }
    return this.enabled;
  }

  start() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);

    // 50 Hz mains hum with a faint second harmonic.
    for (const [frequency, level] of [[50, .045], [100, .012]]) {
      const oscillator = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.value = level;
      oscillator.connect(gain).connect(this.master);
      oscillator.start();
    }

    const noise = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noise=noise;
    this.world=this.ctx.createGain();this.world.gain.value=.8;this.world.connect(this.master);
    const reverb=this.ctx.createConvolver(),impulse=this.ctx.createBuffer(2,this.ctx.sampleRate*.8,this.ctx.sampleRate);
    for(let channel=0;channel<2;channel++){const data=impulse.getChannelData(channel);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,3)*.22;}
    reverb.buffer=impulse;const wet=this.ctx.createGain();wet.gain.value=.22;this.world.connect(reverb).connect(wet).connect(this.master);
    this.layers={};
    for(const [name,frequency,type] of [['fan',170,'lowpass'],['steam',1500,'bandpass'],['furnace',350,'lowpass'],['water',650,'lowpass']]){
      const source=this.ctx.createBufferSource();source.buffer=noise;source.loop=true;
      const filter=this.ctx.createBiquadFilter();filter.type=type;filter.frequency.value=frequency;filter.Q.value=.6;
      const gain=this.ctx.createGain();gain.gain.value=0;source.connect(filter).connect(gain).connect(this.world);source.start();this.layers[name]=gain;
    }
    const breath = this.ctx.createBufferSource();
    breath.buffer = noise;
    breath.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 570;
    filter.Q.value = .6;
    this.breathGain = this.ctx.createGain();
    this.breathGain.gain.value = 0;
    breath.connect(filter).connect(this.breathGain).connect(this.master);
    breath.start();
  }

  pulse(when, loudness) {
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(76, when);
    oscillator.frequency.exponentialRampToValueAtTime(43, when + .12);
    gain.gain.setValueAtTime(.0001, when);
    gain.gain.exponentialRampToValueAtTime(.16 * loudness, when + .018);
    gain.gain.exponentialRampToValueAtTime(.0001, when + .18);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(when);
    oscillator.stop(when + .19);
  }

  click(when, intensity) {
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = 1050 + Math.random() * 600;
    gain.gain.setValueAtTime(.035 * intensity, when);
    gain.gain.exponentialRampToValueAtTime(.0001, when + .012);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(when);
    oscillator.stop(when + .015);
  }

  tone(when,frequency,duration,volume=.06,type='sine',pan=0){
    const oscillator=this.ctx.createOscillator(),gain=this.ctx.createGain(),stereo=this.ctx.createStereoPanner();
    oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,when);stereo.pan.value=pan;
    gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(volume,when+.015);gain.gain.exponentialRampToValueAtTime(.0001,when+duration);
    oscillator.connect(gain).connect(stereo).connect(this.world);oscillator.start(when);oscillator.stop(when+duration+.02);
  }
  burst(when,frequency,duration,volume,pan=0){
    const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain(),stereo=this.ctx.createStereoPanner();source.buffer=this.noise;filter.type='lowpass';filter.frequency.value=frequency;stereo.pan.value=pan;
    gain.gain.setValueAtTime(volume,when);gain.gain.exponentialRampToValueAtTime(.0001,when+duration);source.connect(filter).connect(gain).connect(stereo).connect(this.world);source.start(when);source.stop(when+duration+.01);
  }
  cue(kind){if(!this.ctx||!this.enabled)return;const now=this.ctx.currentTime;
    if(kind==='success'){this.tone(now,420,.15,.05);this.tone(now+.15,620,.22,.05);}
    else if(kind==='reject'){this.tone(now,120,.25,.06,'triangle');}
    else if(kind==='turn'){this.burst(now,1600,.05,.035);}
    else if(kind==='fall'){this.burst(now,260,.35,.22);}
    else this.burst(now,850,.12,.05);
  }
  update(dt, { moving, temp, pressure, holdingBreath,position={x:0,y:0,z:0},alarm={id:'normal'} }) {
    if (!this.ctx || !this.enabled) return;
    const stress = Math.min(1, (moving ? .28 : 0) + Math.max(0, temp - 65) / 70 + Math.max(0, pressure - 65) / 80 + (holdingBreath ? .25 : 0));
    const now = this.ctx.currentTime;
    const sewer=position.z>5,incinerator=position.x>15,reactor=position.z< -5&&Math.abs(position.x)<5;
    this.layers.fan.gain.setTargetAtTime(incinerator?.035:sewer?.015:.028,now,.3);
    this.layers.steam.gain.setTargetAtTime(sewer?.012:pressure>50?.01:.002,now,.3);
    this.layers.furnace.gain.setTargetAtTime(incinerator?.065:reactor?.022:0,now,.4);
    this.layers.water.gain.setTargetAtTime(sewer?(position.y< -2?.055:.015):0,now,.4);
    if(moving&&now>this.nextStep){this.burst(now,sewer&&position.y< -2?650:1200,.12,.10,this.nextStep%2?-.15:.15);this.tone(now,95,.10,.05,'triangle');this.nextStep=now+.43;}
    if(sewer&&now>this.nextDrip){this.tone(now,1000+Math.random()*500,.13,.035,'sine',Math.random()*1.5-.75);this.nextDrip=now+1.3+Math.random()*2.7;}
    if(alarm.id!==this.alarmId){this.alarmId=alarm.id;this.nextAlarm=now;}
    if(alarm.id!=='normal'&&now>=this.nextAlarm){
      if(alarm.id==='reactor'){
        for(let i=0;i<5;i++)this.tone(now+i*.18,280+i*65,.3,.045,'triangle');
        this.nextAlarm=now+3.2;
      }else if(alarm.id==='containment'){this.tone(now,440,.2,.035);this.tone(now+.3,660,.35,.035);this.nextAlarm=now+10;
      }else if(alarm.id==='coolant'){this.tone(now,370,.25,.055,'triangle');this.tone(now+.4,285,.35,.055,'triangle');this.nextAlarm=now+6;}
      else{for(let i=0;i<3;i++)this.tone(now+i*.24,710,.1,.025,'square');this.nextAlarm=now+5;}
    }
    const breathRate = .22 + stress * .18;
    this.breathPhase += dt * breathRate * Math.PI * 2;
    const envelope = .5 + .5 * Math.sin(this.breathPhase);
    this.breathGain.gain.setTargetAtTime(holdingBreath ? 0 : (.02 + stress * .025) * envelope, now, .06);

    const interval = 60 / (62 + stress * 64);
    if (this.nextBeat < now - .3) this.nextBeat = now;
    if (this.nextBeat <= now + .05) {
      this.pulse(this.nextBeat, .65 + stress * .6);
      this.pulse(this.nextBeat + .19, .38 + stress * .4);
      if (this.coarsePointer.matches && navigator.vibrate) navigator.vibrate(12);
      this.nextBeat += interval;
    }
    if (now >= this.nextGeiger) {
      this.click(now, .3 + temp / 130);
      this.nextGeiger = now + Math.max(.08, .9 - temp / 160) * (.5 + Math.random());
    }
  }
}
