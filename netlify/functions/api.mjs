import { getStore } from "@netlify/blobs";

const dataStore = () => getStore({ name: "mong-thu-cac-data", consistency: "strong" });
const imageStore = () => getStore({ name: "mong-thu-cac-images", consistency: "strong" });
const commentStore = () => getStore({ name: "mong-thu-cac-comments", consistency: "strong" });

const json = (data, status=200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store",
    "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type" }
});

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: {
    "access-control-allow-origin":"*", "access-control-allow-methods":"GET,POST,OPTIONS",
    "access-control-allow-headers":"content-type" }});
  try {
    const url = new URL(req.url);
    if (req.method === "GET" && url.searchParams.has("image")) {
      const key = url.searchParams.get("image");
      if (!/^[a-zA-Z0-9_-]{8,80}$/.test(key)) return new Response("Bad image id", {status:400});
      const blob = await imageStore().get(key, { type: "blob" });
      if (!blob) return new Response("Not found", {status:404});
      const type = blob.type || "application/octet-stream";
      return new Response(blob, { headers: {"content-type":type, "cache-control":"public, max-age=31536000, immutable"}});
    }
    if (req.method === "GET") {
      const stories = await dataStore().get("stories", {type:"json"}) || [];
      const storyId = url.searchParams.get("comments");
      if (storyId) {
        const comments = await commentStore().get(storyId, {type:"json"}) || [];
        return json({comments});
      }
      return json({stories});
    }
    if (req.method !== "POST") return json({error:"Method not allowed"},405);

    const body = await req.json();
    if (body.action === "saveStories") {
      if (!Array.isArray(body.stories)) return json({error:"Invalid stories"},400);
      if (body.stories.length > 500) return json({error:"Too many stories"},400);
      await dataStore().setJSON("stories", body.stories);
      return json({ok:true});
    }
    if (body.action === "addComment") {
      const storyId = String(body.storyId || "").slice(0,100);
      const name = String(body.name || "Độc giả").trim().slice(0,40);
      const content = String(body.content || "").trim().slice(0,1200);
      if (!storyId || !content) return json({error:"Vui lòng nhập bình luận"},400);
      const store = commentStore();
      const comments = await store.get(storyId,{type:"json"}) || [];
      const item = {id:crypto.randomUUID(), name, content, date:new Date().toISOString(), approved:true};
      comments.push(item);
      await store.setJSON(storyId,comments);
      return json({ok:true,comment:item});
    }
    if (body.action === "deleteComment") {
      const storyId = String(body.storyId || "");
      const commentId = String(body.commentId || "");
      const store = commentStore();
      const comments = await store.get(storyId,{type:"json"}) || [];
      await store.setJSON(storyId,comments.filter(c=>c.id!==commentId));
      return json({ok:true});
    }
    if (body.action === "uploadImage") {
      const dataUrl = String(body.dataUrl || "");
      const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
      if (!match) return json({error:"Chỉ hỗ trợ PNG, JPG, WEBP hoặc GIF"},400);
      const buffer = Buffer.from(match[2],"base64");
      if (buffer.length > 4*1024*1024) return json({error:"Ảnh tối đa 4MB"},400);
      const id = crypto.randomUUID().replaceAll("-","");
      await imageStore().set(id, new Blob([buffer],{type:match[1]}));
      return json({ok:true,url:`/.netlify/functions/api?image=${id}`});
    }
    return json({error:"Action không hợp lệ"},400);
  } catch (error) {
    console.error(error);
    return json({error:"Máy chủ gặp lỗi. Kiểm tra Function logs trên Netlify."},500);
  }
};
