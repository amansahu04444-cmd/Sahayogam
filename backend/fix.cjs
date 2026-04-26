const fs = require('fs');
let code = fs.readFileSync('controllers/chatController.js', 'utf8');

// Replace the bad string that got inserted previously
code = code.replace(/const chats = await chatService\.getChatList\(userId, userRole\);\\n\\n    console\.log\(\\'FETCHED CHATS:\\', chats\);/g, 'const chats = await chatService.getChatList(userId, userRole);');

// Now replace the correct block
code = code.replace(/const userRole = req\.query\.role \|\| 'volunteer'; \/\/ Determine from auth\r?\n\r?\n    const chats = await chatService\.getChatList\(userId, userRole\);/g, 
`const userRole = req.user.role; // Determine from auth

    console.log("USER ROLE:", userRole);

    const chats = await chatService.getChatList(userId, userRole);
    
    console.log("FETCHED CHATS:", chats);`);

fs.writeFileSync('controllers/chatController.js', code);
console.log("Done");
