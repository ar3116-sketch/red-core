// Gentle voltage drift with occasional irregular brownouts, not a periodic strobe.
export function lampVoltage(time,seed,damaged=false) {
 const drift=.94+.035*Math.sin(time*2.1+seed)+.025*Math.sin(time*3.7+seed*1.9);
 if(!damaged)return drift;
 const t=time+seed*2.71,cycle=Math.floor(t/8.7),phase=t-cycle*8.7;
 const noise=Math.sin(cycle*127.1+seed*311.7)*43758.5453;
 const start=1+(noise-Math.floor(noise))*4;
 if(phase>start&&phase<start+.20)return .10;
 if(phase>start+.45&&phase<start+1.05)return .35;
 return drift;
}
