(function(){
  "use strict";
  const STORAGE_KEY="hallCleaningState";
  const SCHEMA_VERSION=1;
  const DEFAULT_STATE=Object.freeze({schemaVersion:SCHEMA_VERSION,completedTaskIds:{afterMeeting:[],deepCleaning:[]},schedule:[null,null,null,null],theme:"green"});
  const createDefaultState=()=>JSON.parse(JSON.stringify(DEFAULT_STATE));
  const isStringArray=(value)=>Array.isArray(value)&&value.every((item)=>typeof item==="string");
  function loadState(){
    try{
      const stored=JSON.parse(localStorage.getItem(STORAGE_KEY));
      if(!stored||stored.schemaVersion!==SCHEMA_VERSION)return createDefaultState();
      const ids=stored.completedTaskIds||{};
      return{schemaVersion:SCHEMA_VERSION,completedTaskIds:{afterMeeting:isStringArray(ids.afterMeeting)?ids.afterMeeting:[],deepCleaning:isStringArray(ids.deepCleaning)?ids.deepCleaning:[]},schedule:Array.isArray(stored.schedule)&&stored.schedule.length===4?stored.schedule:DEFAULT_STATE.schedule,theme:typeof stored.theme==="string"?stored.theme:DEFAULT_STATE.theme};
    }catch(error){console.warn("Saved Hall Cleaning state could not be read. Defaults were restored.",error);return createDefaultState()}
  }
  function saveState(state){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(error){console.warn("Hall Cleaning state could not be saved.",error)}}
  const state=loadState();saveState(state);
  const tabs=Array.from(document.querySelectorAll("[data-view]"));
  const views=Array.from(document.querySelectorAll(".view"));
  const choiceMessage=document.querySelector("#choice-message");
  function showView(name){tabs.forEach((tab)=>{const active=tab.dataset.view===name;tab.classList.toggle("is-active",active);tab.setAttribute("aria-selected",String(active));tab.tabIndex=active?0:-1});views.forEach((view)=>{view.hidden=view.id!==`${name}-view`})}
  tabs.forEach((tab,index)=>{tab.addEventListener("click",()=>showView(tab.dataset.view));tab.addEventListener("keydown",(event)=>{if(event.key!=="ArrowLeft"&&event.key!=="ArrowRight")return;event.preventDefault();const direction=event.key==="ArrowRight"?1:-1;const next=tabs[(index+direction+tabs.length)%tabs.length];showView(next.dataset.view);next.focus()})});
  document.querySelectorAll("[data-cleaning-type]").forEach((choice)=>choice.addEventListener("click",()=>{choiceMessage.textContent=`${choice.querySelector("strong").textContent} will open here in the next development increment.`}));
  if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch((error)=>console.warn("Offline support could not be started.",error)));
})();
