# SwiftCart
#### 1) What is the difference between `null` and `undefined`?
`undefined` মানে কোনো ভেরিয়েবল ডিক্লেয়ার করা হয়েছে কিন্তু এখনো কোনো মান দেওয়া হয়নি, বা কোনো প্রপার্টি/রিটার্ন ভ্যালু পাওয়া যায়নি।

`null` মানে ইচ্ছাকৃতভাবে "খালি" বা "কোনো মান নেই" সেট করা হয়েছে। অর্থাৎ ডেভেলপার নিজে মানটি `null` দিয়েছে।


#### 2) What is the use of the `map()` function in JavaScript? How is it different from `forEach()`?
`map()` একটি অ্যারের প্রতিটি আইটেমের উপর কাজ করে নতুন একটি অ্যারে রিটার্ন করে। তাই ডাটা ট্রান্সফর্ম করার জন্য `map()` ব্যবহার করা হয়।

`forEach()` প্রতিটি আইটেমে কাজ করে, কিন্তু নতুন অ্যারে রিটার্ন করে না। সাধারণত সাইড ইফেক্ট (যেমন console log, DOM update) এর জন্য ব্যবহার হয়।

মূল পার্থক্য:
- `map()` -> নতুন অ্যারে দেয়
- `forEach()` -> কিছু রিটার্ন করে না (`undefined`)

#### 3) What is the difference between `==` and `===`?
`==` শুধু মান (value) তুলনা করে, দরকার হলে টাইপ কনভার্সন করে নেয় ।

`===` মান এবং টাইপ দুটোই একই কিনা দেখে। টাইপ কনভার্সন করে না।

তাই bug কমানোর জন্য সাধারণভাবে `===` ব্যবহার করা ভালো।

#### 4) What is the significance of `async`/`await` in fetching API data?
API call asynchronous, অর্থাৎ রেসপন্স পেতে সময় লাগে। `async/await` ব্যবহার করলে asynchronous কোড synchronous-এর মতো readable হয়, ফলে:
- কোড সহজে বোঝা যায়
- promise chain কমে যায়
- `try/catch` দিয়ে error handling পরিষ্কারভাবে করা যায়
- maintain করা সহজ হয়

#### 5) Explain the concept of Scope in JavaScript (Global, Function, Block).
Scope মানে ভেরিয়েবল কোথায় accessible হবে তার সীমা।

- **Global Scope:** যে ভেরিয়েবল global এ ডিক্লেয়ার করা হয়, প্রোগ্রামের প্রায় সব জায়গা থেকে ব্যবহার করা যায়।
- **Function Scope:** `var` দিয়ে function এর ভিতরে ডিক্লেয়ার করা ভেরিয়েবল শুধু ওই function এর ভিতরেই কাজ করে।
- **Block Scope:** `let`/`const` দিয়ে `{}` block এর ভিতরে ডিক্লেয়ার করা ভেরিয়েবল শুধুই ওই block এ ব্যবহার করা যায় (if, for, while ইত্যাদি)।


***Live Link :** https://shswiftcart.netlify.app/

**GitHub Repository:** https://github.com/samshawon10/SwiftCart