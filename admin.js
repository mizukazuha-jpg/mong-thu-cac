const $=s=>document.querySelector(s);let stories=[],editing=null,coverUrl="",chapters=[];
async function request(body,method="POST"){let r=await fetch("/.netlify/functions/api",{method,headers:{"content-type":"application/json"},body:method==="POST"?JSON.stringify(body):undefined});let j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.error||"Lỗi API");return j}
const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function uid(){return "story-"+Math.random().toString(36).slice(2,10)}
async function load(){try{stories=(await request(null,"GET")).stories||[];if(!stories.length){const seed=await fetch("seed.json");if(seed.ok)stories=await seed.json()}}catch(e){alert("Không kết nối được dữ liệu. Hãy deploy lên Netlify trước.")}renderList();renderComments()}
function renderList(){$("#storyList").innerHTML=stories.map(s=>`<div class="story-row"><div><strong>${esc(s.title)}</strong><small>${esc(s.author)} · ${(s.chapters||[]).length} chương · ${s.status==="completed"?"Đã hoàn":"Đang viết"}</small></div><div class="actions"><button class="secondary" data-edit="${esc(s.id)}">Sửa</button><button class="danger" data-delete="${esc(s.id)}">Xóa</button></div></div>`).join("")||'<p class="muted">Chưa có truyện.</p>'}
function reset(){editing=null;coverUrl="";chapters=[];$("#storyForm").reset();$("#storyForm [name=id]").value="";$("#coverPreview").removeAttribute("src");$("#coverPreview").textContent="✦";$("#formTitle").textContent="Tạo truyện mới";renderChapters()}

function normalizedBlocks(c){
  if(Array.isArray(c.blocks) && c.blocks.length) return JSON.parse(JSON.stringify(c.blocks));
  return [{id:uid(),type:"text",content:c.content||""}];
}
function renderChapters(){
  $("#chapters").innerHTML=chapters.map((c,i)=>{
    c.blocks=normalizedBlocks(c);
    const blocks=c.blocks.map((b,j)=>b.type==="image"
      ? `<div class="content-block image-block" data-block="${j}"><div class="block-head"><strong>Ảnh minh họa ${j+1}</strong><button class="danger" type="button" data-remove-block="${j}">Xóa khối</button></div><label class="formfield">Tải ảnh (PNG/JPG/WEBP/GIF, tối đa 4MB)<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-image-upload="${j}"></label>${b.url?`<img class="chapter-image-preview" src="${esc(b.url)}" alt="Ảnh minh họa">`:b.uploading?'<p class="muted">Đang tải ảnh...</p>':b.uploadError?'<p class="muted">Tải ảnh thất bại. Thử lại bằng nút Chọn tệp.</p>':'<p class="muted">Chưa có ảnh. Chọn tệp để tải lên.</p>'}<label class="formfield">Chú thích ảnh<input data-block-caption="${j}" value="${esc(b.caption||"")}" placeholder="Không bắt buộc"></label></div>`
      : `<div class="content-block text-block" data-block="${j}"><div class="block-head"><strong>Đoạn văn ${j+1}</strong><button class="danger" type="button" data-remove-block="${j}">Xóa khối</button></div><label class="formfield">Nội dung<textarea data-block-text="${j}" rows="5" placeholder="Viết nội dung đoạn truyện...">${esc(b.content||"")}</textarea></label></div>`
    ).join("");
    return `<div class="chapter-editor" data-chapter="${i}"><header><span>Chương ${i+1}</span><button class="danger" type="button" data-remove-chapter="${i}">Xóa chương</button></header><div class="formgrid"><label class="formfield">Tên chương<input data-cfield="title" value="${esc(c.title)}" required></label><label class="formfield">Ngày cập nhật<input data-cfield="date" type="date" value="${esc(c.date||"")}"></label></div><div class="content-blocks">${blocks}</div><div class="block-actions"><button class="secondary" type="button" data-add-text>＋ Thêm đoạn chữ</button><button class="secondary" type="button" data-add-image>＋ Chèn ảnh</button><button class="secondary" type="button" data-batch-image>⇧ Tải nhiều ảnh</button><input class="batch-image-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden></div></div>`;
  }).join("")||'<p class="muted">Chưa có chương. Bấm “Thêm chương” để bắt đầu.</p>';
}
function collectChapters(){
  document.querySelectorAll(".chapter-editor").forEach((el,i)=>{
    const c=chapters[i];
    c.title=el.querySelector('[data-cfield="title"]').value;
    c.date=el.querySelector('[data-cfield="date"]').value;
    el.querySelectorAll(".content-block").forEach(blockEl=>{
      const j=Number(blockEl.dataset.block), b=c.blocks[j];
      if(!b)return;
      if(b.type==="image") b.caption=blockEl.querySelector(`[data-block-caption="${j}"]`)?.value||"";
      else b.content=blockEl.querySelector(`[data-block-text="${j}"]`)?.value||"";
    });
    c.content=c.blocks.filter(b=>b.type==="text").map(b=>b.content||"").join("\n\n");
  });
}
$("#addChapter").onclick=()=>{collectChapters();chapters.push({id:uid(),title:`Chương ${chapters.length+1}`,date:new Date().toISOString().slice(0,10),content:"",blocks:[{id:uid(),type:"text",content:""}]});renderChapters()};
$("#chapters").addEventListener("click",e=>{
  const chapterEl=e.target.closest(".chapter-editor");
  if(!chapterEl)return;
  const ci=Number(chapterEl.dataset.chapter);
  if(e.target.closest("[data-remove-chapter]")){collectChapters();chapters.splice(ci,1);renderChapters();return}
  if(e.target.closest("[data-batch-image]")){chapterEl.querySelector(".batch-image-input").click();return}
  if(e.target.closest("[data-add-text]")||e.target.closest("[data-add-image]")){
    collectChapters();
    const isImage=!!e.target.closest("[data-add-image]");
    chapters[ci].blocks.push(isImage?{id:uid(),type:"image",url:"",caption:""}:{id:uid(),type:"text",content:""});
    renderChapters();return;
  }
  const remove=e.target.closest("[data-remove-block]");
  if(remove){collectChapters();chapters[ci].blocks.splice(Number(remove.dataset.removeBlock),1);renderChapters()}
});
function readAsDataURL(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error("Không đọc được tệp"));reader.readAsDataURL(file)})}
function setBatchStatus(done,total,message,errors=[]){const box=$("#batchUploadStatus");box.classList.remove("hidden");$("#batchUploadText").textContent=message;$("#batchUploadCount").textContent=`${done}/${total}`;$("#batchUploadProgress").value=total?done/total*100:0;$("#batchUploadErrors").textContent=errors.length?"Ảnh lỗi: "+errors.join(", "):""}
$("#chapters").addEventListener("change",async e=>{
  const batch=e.target.closest(".batch-image-input");
  if(batch&&batch.files?.length){
    const files=Array.from(batch.files),chapterEl=batch.closest(".chapter-editor"),ci=Number(chapterEl.dataset.chapter),valid=[],errors=[];
    collectChapters();
    files.forEach(file=>{if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type))errors.push(file.name+" (định dạng)");else if(file.size>4*1024*1024)errors.push(file.name+" (trên 4MB)");else valid.push(file)});
    const startIndex=chapters[ci].blocks.length;
    valid.forEach(file=>chapters[ci].blocks.push({id:uid(),type:"image",url:"",caption:file.name.replace(/\.[^.]+$/,""),uploading:true}));
    renderChapters();
    let done=0;setBatchStatus(0,valid.length,`Đang chuẩn bị tải ${valid.length} ảnh...`,errors);
    for(let i=0;i<valid.length;i++){
      try{const dataUrl=await readAsDataURL(valid[i]);const result=await request({action:"uploadImage",dataUrl});chapters[ci].blocks[startIndex+i].url=result.url;chapters[ci].blocks[startIndex+i].uploading=false}
      catch(err){chapters[ci].blocks[startIndex+i].uploading=false;chapters[ci].blocks[startIndex+i].uploadError=true;errors.push(valid[i].name+" (tải thất bại)")}
      done++;setBatchStatus(done,valid.length,done===valid.length?`Đã xử lý ${done} ảnh.`:`Đang tải ảnh ${done}/${valid.length}...`,errors);
    }
    renderChapters();batch.value="";return;
  }
  const input=e.target.closest("[data-image-upload]");if(!input||!input.files?.[0])return;
  const file=input.files[0],ci=Number(input.closest(".chapter-editor").dataset.chapter),bi=Number(input.dataset.imageUpload);
  if(file.size>4*1024*1024){alert("Ảnh tối đa 4MB");input.value="";return}
  try{const dataUrl=await readAsDataURL(file);const result=await request({action:"uploadImage",dataUrl});collectChapters();chapters[ci].blocks[bi].url=result.url;renderChapters()}
  catch(err){alert("Không tải được ảnh: "+err.message)}
});
$("#newStory").onclick=reset;$("#resetForm").onclick=reset;
$("#storyList").addEventListener("click",async e=>{let ed=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");if(ed){let s=stories.find(x=>x.id===ed.dataset.edit);editing=s.id;coverUrl=s.cover||"";chapters=JSON.parse(JSON.stringify(s.chapters||[]));let f=$("#storyForm");for(let k of ["id","title","author","subtitle","status","symbol","description"])f.elements[k].value=s[k]||"";f.elements.genre.value=(s.genre||[]).join(", ");$("#coverPreview").src=coverUrl||"";$("#formTitle").textContent="Chỉnh sửa: "+s.title;renderChapters();window.scrollTo({top:0,behavior:"smooth"})}
if(del){if(!confirm("Xóa truyện này và toàn bộ chương?"))return;stories=stories.filter(s=>s.id!==del.dataset.delete);await saveAll() }});
$("#coverFile").onchange=async e=>{let file=e.target.files[0];if(!file)return;if(file.size>4*1024*1024){alert("Ảnh tối đa 4MB");e.target.value="";return}let reader=new FileReader();reader.onload=async()=>{try{let result=await request({action:"uploadImage",dataUrl:reader.result});coverUrl=result.url;$("#coverPreview").src=coverUrl}catch(err){alert(err.message)}};reader.readAsDataURL(file)};
$("#storyForm").onsubmit=async e=>{e.preventDefault();collectChapters();let f=new FormData(e.target),id=editing||uid();let old=stories.find(s=>s.id===id);let story={id,title:f.get("title").trim(),author:f.get("author").trim()||"Ẩn danh",subtitle:f.get("subtitle"),genre:f.get("genre").split(",").map(x=>x.trim()).filter(Boolean),status:f.get("status"),symbol:f.get("symbol")||"✦",description:f.get("description"),cover:coverUrl,date:new Date().toISOString().slice(0,10),chapters};if(old)story.date=old.date||story.date;let i=stories.findIndex(s=>s.id===id);if(i>=0)stories[i]=story;else stories.unshift(story);await saveAll();reset()};
async function saveAll(){try{await request({action:"saveStories",stories});alert("Đã lưu dữ liệu truyện lên Netlify.");renderList();renderComments()}catch(e){alert("Không lưu được: "+e.message)}}
async function renderComments(){let all=[];for(let s of stories){try{let r=await fetch("/.netlify/functions/api?comments="+encodeURIComponent(s.id));let j=await r.json();(j.comments||[]).forEach(c=>all.push({...c,storyId:s.id,storyTitle:s.title}))}catch{}}
$("#commentAdmin").innerHTML=all.map(c=>`<div class="comments-admin"><div><b>${esc(c.name)}</b> · ${esc(c.storyTitle)}<div>${esc(c.content)}</div><small class="muted">${new Date(c.date).toLocaleString("vi-VN")}</small></div><button class="danger" data-comment-story="${esc(c.storyId)}" data-comment-id="${esc(c.id)}">Xóa</button></div>`).join("")||'<p class="muted">Chưa có bình luận.</p>'}
$("#commentAdmin").onclick=async e=>{let b=e.target.closest("[data-comment-id]");if(!b||!confirm("Xóa bình luận này?"))return;try{await request({action:"deleteComment",storyId:b.dataset.commentStory,commentId:b.dataset.commentId});renderComments()}catch(err){alert(err.message)}};
load();reset();
