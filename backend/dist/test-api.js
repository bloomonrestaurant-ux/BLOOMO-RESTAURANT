"use strict";
console.log('Sending test requests to local backend server at http://localhost:5000...');
async function testApi() {
    try {
        const healthRes = await fetch('http://localhost:5000/health');
        console.log('Health check response status:', healthRes.status);
        console.log('Health check response data:', await healthRes.json());
    }
    catch (e) {
        console.error('Health check failed:', e.message);
    }
    try {
        const categoriesRes = await fetch('http://localhost:5000/api/v1/menu/categories');
        console.log('Categories retrieval response status:', categoriesRes.status);
        console.log('Categories retrieval response data:', await categoriesRes.json());
    }
    catch (e) {
        console.error('Categories retrieval failed:', e.message);
    }
    try {
        const itemsRes = await fetch('http://localhost:5000/api/v1/menu/items');
        console.log('Menu items retrieval response status:', itemsRes.status);
        console.log('Menu items retrieval response data:', await itemsRes.json());
    }
    catch (e) {
        console.error('Menu items retrieval failed:', e.message);
    }
}
testApi();
