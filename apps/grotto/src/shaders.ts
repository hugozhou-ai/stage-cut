export const vertexShader = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0., 1.); }
`;

export const fragmentShader = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 resolution;
uniform float time;
uniform sampler2D mural;
uniform sampler2D statueTexture;

#define PI 3.14159265
float sat(float x){return clamp(x,0.,1.);}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float fbm(vec2 p){return .55*noise(p)+.27*noise(p*2.03)+.13*noise(p*4.07);}
float torus(vec3 p,vec2 t){return length(vec2(length(p.xy)-t.x,p.z))-t.y;}
vec2 closer(vec2 a,vec2 b){return a.x<b.x?a:b;}

vec2 map(vec3 p){
  // Analytic room surfaces; repeated structural ribs remain one shared world.
  vec2 d=vec2(p.y,1.);
  d=closer(d,vec2(5.4-p.y,2.));
  d=closer(d,vec2(4.8-abs(p.x),2.));
  d=closer(d,vec2(p.z+12.,2.));
  vec3 q=p; q.z=mod(p.z+1.,4.)-2.;
  float column=length(vec2(abs(p.x)-3.65,q.z))-.19;
  column=max(column,max(-p.y,p.y-2.05));
  float ring=length(vec2(length(vec2(p.x,p.y-2.05))-3.65,q.z))-.16;
  ring=max(ring,2.05-p.y);
  d=closer(d,vec2(min(column,ring),3.));
  vec3 b=p-vec3(0.,0.,-6.7);
  float dissolve=smoothstep(36.,43.,time);
  float halo=torus(b-vec3(0,2.88,-.45),vec2(.87,.016));
  halo=min(halo,torus(b-vec3(0,2.88,-.45),vec2(.94,.007)));
  d=closer(d,vec2(halo+dissolve*.8,5.));
  return d;
}

vec3 normalAt(vec3 p){vec2 e=vec2(.003,0);return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x,map(p+e.yxy).x-map(p-e.yxy).x,map(p+e.yyx).x-map(p-e.yyx).x));}
vec2 statueUV(vec3 p){return vec2((p.x+1.25)/2.5,(3.95-p.y)/3.75);}
vec2 trace(vec3 ro,vec3 rd){
  float t=.015;float id=-1.;
  for(int i=0;i<72;i++){vec2 h=map(ro+rd*t);if(h.x<.0025){id=h.y;break;}t+=max(.002,h.x*.82);if(t>38.)break;}
  if(abs(rd.z)>.0001){
    float plane=(-6.7-ro.z)/rd.z;
    vec3 p=ro+rd*plane;vec2 uv=statueUV(p);
    if(plane>0. && plane<t && all(greaterThanEqual(uv,vec2(0))) && all(lessThanEqual(uv,vec2(1)))){
      float alpha=texture(statueTexture,uv).a;
      float dissolve=smoothstep(36.,42.,time);
      if(alpha>.42 && noise(p.xy*18.)>dissolve){t=plane;id=6.;}
    }
  }
  return vec2(t,id);
}

vec3 material(vec3 p,float id){
  float rock=fbm(p.xz*6.+p.y*2.);
  vec3 color=vec3(.18,.115,.067)*(rock*.6+.7);
  if(id==1.){
    color=vec3(.075,.088,.084)*(rock*.5+.75);
    float joints=step(.985,fract(p.x*.65))+step(.99,fract(p.z*.7));
    color*=1.-joints*.55;
  }
  if(id==2.){
    vec2 uv=abs(p.x)>4.7?vec2(p.z/7.5,1.-p.y/5.1):vec2(p.x/8.+.5,1.-p.y/5.1);
    color=pow(texture(mural,vec2(fract(uv.x),clamp(uv.y,0.,1.))).rgb,vec3(1.5))*.70;
    float borders=1.-smoothstep(.03,.08,min(abs(p.y-.4),abs(p.y-4.75)));
    color=mix(color,vec3(.22,.13,.045),borders*.7);
  }
  if(id==3.)color=vec3(.28,.20,.10)*(rock*.55+.65);
  if(id==6.)color=pow(texture(statueTexture,statueUV(p)).rgb,vec3(1.35))*.80;
  if(id==5.)color=vec3(1.2,.56,.12);
  return color;
}

vec3 lightAt(vec3 p,vec3 n,vec3 rd,float id){
  vec3 lamp=vec3(1.0+sin(time*.19)*.65,2.1,-1.6+sin(time*.13));
  vec3 l=lamp-p;float d=length(l);l/=d;
  float diffuse=max(dot(n,l),0.);
  vec3 col=material(p,id);
  vec3 illumination=vec3(.10,.13,.15)+vec3(1.65,1.10,.51)*diffuse*(4.5/(1.+d*d*.27));
  illumination+=vec3(.22,.35,.40)*max(dot(n,normalize(vec3(-.4,1.,.5))),0.)*.34;
  vec3 result=col*illumination;
  float spec=pow(max(dot(reflect(-l,n),-rd),0.),id==6.?56.:95.);
  result+=vec3(1.,.67,.28)*spec*(id==6.?.12:.15)/(1.+d*.15);
  if(id==6.)result+=col*.38;
  if(id==5.)result+=col*1.7;
  return result;
}

vec3 scene(vec3 ro,vec3 rd){
  vec3 acc=vec3(0),throughput=vec3(1);
  float mirror=smoothstep(22.,28.,time)*(1.-smoothstep(36.,42.,time));
  for(int bounce=0;bounce<3;bounce++){
    vec2 h=trace(ro,rd);
    if(h.y<0.){acc+=throughput*vec3(.012,.017,.02);break;}
    vec3 p=ro+rd*h.x;
    vec3 n=h.y==6.?vec3(0,0,rd.z<0.?1.:-1.):normalAt(p);
    vec3 col=lightAt(p,n,rd,h.y);
    float reflectivity=h.y==1.?.53:(h.y==2. && abs(p.x)>4.7?mirror*.88:0.);
    float fog=1.-exp(-h.x*.027);
    col=mix(col,vec3(.020,.029,.034),fog);
    if(bounce==0){
      float shaft=pow(max(dot(rd,normalize(vec3(-.16,.50,-1.))),0.),34.);
      col+=vec3(.25,.29,.25)*shaft*(1.-exp(-h.x*.15))*.40;
    }
    acc+=throughput*col*(1.-reflectivity);
    if(reflectivity<.01)break;
    throughput*=reflectivity*vec3(.93,.88,.77);
    ro=p+n*.018;rd=reflect(rd,n);
  }
  return acc;
}

void main(){
  vec2 uv=(gl_FragCoord.xy-.5*resolution)/resolution.y;
  float intro=smoothstep(0.,3.,time);
  vec3 ro=vec3(.28*sin(time*.12),1.83,8.-7.*smoothstep(0.,12.,time));
  vec3 target=vec3(0.,2.05,-6.7);
  float closeup=smoothstep(11.,15.,time)*(1.-smoothstep(21.,25.,time));
  ro=mix(ro,vec3(3.4,2.35,-1.-time*.035),closeup);
  target=mix(target,vec3(4.8,2.45,-3.1),closeup);
  float hall=smoothstep(24.,28.,time);
  ro=mix(ro,vec3(.85*sin(time*.14),1.8,1.2-(time-28.)*.17),hall);
  float leaving=smoothstep(35.,44.,time);
  ro=mix(ro,vec3(.15,2.25,7.),leaving);
  target=mix(target,vec3(0.,2.0,-6.),leaving);
  vec3 forward=normalize(target-ro),right=normalize(cross(forward,vec3(0,1,0))),up=cross(right,forward);
  vec3 rd=normalize(forward*1.65+right*uv.x+up*uv.y);
  vec3 col=scene(ro,rd);
  // Parallax motes are deterministic in absolute film time, not browser time.
  for(int i=0;i<54;i++){
    float fi=float(i),z=fract(fi*.618+.02*time)*1.4+.25;
    vec2 pos=vec2(sin(fi*12.71+time*.06),cos(fi*7.13+time*.035))*.85/z;
    pos.y+=.12*sin(fi+time*.12);
    float d=length((uv-pos)*vec2(1.,1.));
    float mote=exp(-d*d*(13000.+z*6000.));
    col+=vec3(.44,.27,.09)*mote*(.3+.7*hash(vec2(fi,4.)));
  }
  // Dissolution becomes concentric golden lotus filaments suspended in darkness.
  float release=smoothstep(36.,42.,time);
  float r=length(uv*vec2(1.,1.15)),a=atan(uv.y,uv.x);
  float petals=abs(r-(.22+.055*cos(a*12.+time*.12))*(1.+(time-39.)*.035));
  float lines=exp(-petals*850.)+exp(-abs(r-.34-.025*sin(a*24.-time*.08))*1100.)*.5;
  vec3 lotus=vec3(.95,.56,.17)*lines;
  float end=smoothstep(43.,47.,time);
  col=mix(col,vec3(.008,.012,.014)+lotus,release*.90);
  col*=1.-end*.65;
  col=vec3(1.)-exp(-col*1.9);
  col=pow(col,vec3(.87));
  float vignette=1.-.30*pow(length(uv*vec2(.68,1.)),1.4);
  col*=vignette*intro;
  col+=(hash(gl_FragCoord.xy+floor(time*24.))-.5)*.014;
  fragColor=vec4(max(col,0.),1.);
}
`;
