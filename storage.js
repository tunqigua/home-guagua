import {KEY,SESSION_KEY,ROOM_KEY,emptyState,validateDraft,validateRoom,complete,score,defaultConfig,initialItems} from './logic.js';
export function createStorage(getSession,getLocal,onFailure) {
  const read=(get,key)=>{try{const raw=get().getItem(key);if(!raw)return null;try{return JSON.parse(raw);}catch{return null;}}catch{onFailure();return null;}};
  const write=(get,key,value)=>{try{get().setItem(key,JSON.stringify(value));return true;}catch{onFailure();return false;}};
  const remove=(get,key)=>{try{get().removeItem(key);return true;}catch{onFailure();return false;}};
  let remembered=false;
  return {
    load(){
      const saved=read(getSession,SESSION_KEY),state=emptyState();
      state.draft=validateDraft(saved?.draft);state.own=validateRoom(saved?.own);
      const durable=validateRoom(read(getLocal,ROOM_KEY));
      remembered=!!durable;
      if(!state.own)state.own=durable;
      const old=read(getLocal,KEY);
      if(old?.version===1){
        if(!state.draft)state.draft=validateDraft(old.draft);
        if(!state.own&&complete(old.completed)){const initialItem=initialItems[old.completed[7]];state.own={config:defaultConfig(score(old.completed),initialItem),initialItem};}
        // Delete the old answers only after the minimal replacement is safely written.
        if(write(getSession,SESSION_KEY,state))remove(getLocal,KEY);
      }
      return state;
    },
    persist(state){const ok=write(getSession,SESSION_KEY,{draft:validateDraft(state.draft),own:validateRoom(state.own)});if(remembered&&state.own)write(getLocal,ROOM_KEY,validateRoom(state.own));return ok;},
    isRemembered:()=>remembered,
    remember(value,state){if(value){remembered=!!state.own&&write(getLocal,ROOM_KEY,validateRoom(state.own));}else{remembered=false;remove(getLocal,ROOM_KEY);}return remembered;},
    clear(){remembered=false;let ok=true;for(const get of [getLocal,getSession])for(const key of [KEY,SESSION_KEY,ROOM_KEY])if(!remove(get,key))ok=false;return ok;}
  };
}
