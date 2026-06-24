// --- 1. Interactive Resource Allocation Graph (RAG) Controller ---
const ragSteps = [
    {
        status: "ขั้นตอนที่ 1: ระบบเริ่มต้น ทุกทรัพยากรยังว่างเปล่า ไม่มีโปรเซสใดขอใช้งาน (Safe State)",
        edges: []
    },
    {
        status: "ขั้นตอนที่ 2: จัดสรรทรัพยากรให้ผู้ถือครอง (Assignment Edges: R1 ให้ P1 และ R2 ให้ P2)",
        edges: [
            { from: "r1", to: "p1", type: "assign" },
            { from: "r2", to: "p2", type: "assign" }
        ]
    },
    {
        status: "ขั้นตอนที่ 3: โปรเซส 1 ขอดึงทรัพยากร R2 เพิ่มเติม (Request Edge: P1 ไป R2) ซึ่งติดค้างที่ P2 ถืออยู่",
        edges: [
            { from: "r1", to: "p1", type: "assign" },
            { from: "r2", to: "p2", type: "assign" },
            { from: "p1", to: "r2", type: "request" }
        ]
    },
    {
        status: "ขั้นตอนที่ 4: เกิดจุดวิกฤต! เมื่อโปรเซส 2 ร้องขอ R1 คืน (Request Edge: P2 ไป R1) เกิดวงรอบปิดสมบูรณ์ (Deadlock Cycle!)",
        edges: [
            { from: "r1", to: "p1", type: "deadlock" },
            { from: "r2", to: "p2", type: "deadlock" },
            { from: "p1", to: "r2", type: "deadlock" },
            { from: "p2", to: "r1", type: "deadlock" }
        ]
    }
];

let currentRagStep = 0;

function drawRagEdges() {
    const edgesContainer = document.getElementById("edges-container");
    if (!edgesContainer) return;
    
    // Clear old edges
    edgesContainer.innerHTML = "";
    
    const step = ragSteps[currentRagStep];
    const statusText = document.getElementById("rag-status-text");
    if (statusText) statusText.textContent = step.status;
    
    // Node coordinates map
    const coords = {
        r1: { x: 100, y: 60 },
        r2: { x: 350, y: 60 },
        p1: { x: 100, y: 220 },
        p2: { x: 350, y: 220 }
    };
    
    step.edges.forEach(edge => {
        const start = coords[edge.from];
        const end = coords[edge.to];
        
        let markerId = "rag-arrow-request";
        let strokeColor = "#D4A373"; // default request beige/orange
        let strokeWidth = 3;
        let isDashed = false;
        
        if (edge.type === "assign") {
            markerId = "rag-arrow-assign";
            strokeColor = "#81B29A"; // sage green
            strokeWidth = 3;
        } else if (edge.type === "deadlock") {
            markerId = "rag-arrow-deadlock";
            strokeColor = "#E07A5F"; // warm red/coral
            strokeWidth = 4;
        }
        
        // Offset arrow start and end slightly to make it look neat around circles/rectangles
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate offset line
        const startX = start.x;
        const startY = start.y;
        const endX = end.x;
        const endY = end.y;
        
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", startX);
        line.setAttribute("y1", startY);
        line.setAttribute("x2", endX);
        line.setAttribute("y2", endY);
        line.setAttribute("stroke", strokeColor);
        line.setAttribute("stroke-width", strokeWidth);
        line.setAttribute("marker-end", `url(#${markerId})`);
        
        if (edge.type === "deadlock") {
            line.style.animation = "dash 1.5s linear infinite";
            line.setAttribute("stroke-dasharray", "8 4");
        }
        
        edgesContainer.appendChild(line);
    });
    
    // Enable/disable navigation buttons
    document.getElementById("btn-prev-rag").disabled = (currentRagStep === 0);
    document.getElementById("btn-next-rag").disabled = (currentRagStep === ragSteps.length - 1);
}

// Add SVG animation styles programmatically
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes dash {
        to {
            stroke-dashoffset: -20;
        }
    }
    .animal-node {
        transition: transform 0.5s ease;
    }
    .animal-node.sleeping {
        opacity: 0.5;
        transform: scale(0.9) rotate(3deg);
    }
    .animal-node.working {
        animation: dance 0.6s ease infinite alternate;
    }
    @keyframes dance {
        from { transform: translateY(0) scale(1.05); }
        to { transform: translateY(-10px) scale(1.05); }
    }
`;
document.head.appendChild(styleSheet);


// --- 2. Mini Game: Save the Picnic! ---
const gameStates = {
    locked: {
        status: "สถานะ: ติดขัด (Deadlock!)",
        dialogue: "พี่หมีถือตะกร้าแต่ต้องการผ้าห่ม, กระต่ายถือผ้าห่มแต่ต้องการกระติกน้ำ, กระรอกถือกระติกแต่ต้องการตะกร้า! รอวนกันเป็นวงกลม ไม่ปิกนิกไม่ได้แล้ว!",
        dialogueHeader: "คุณยายจิ้งจอก (ผู้ตรวจการ)"
    },
    preempted: {
        status: "สถานะ: ปลดล็อคได้ด้วยการสลัดสิทธิ์!",
        dialogue: "คุณขอคืนตะกร้าจากพี่หมีชั่วคราว ส่งผลให้กระรอกน้อยที่รอคอยอยู่ มีทรัพยากรครบถ้วนสามารถทำงานและกินขนมได้จนเสร็จสิ้น จากนั้นเมื่อเสร็จแล้ว กระรอกจะปล่อยตะกร้าและกระติกน้ำคืน เพื่อให้คนถัดไปเล่นต่อได้จนหมด!",
        dialogueHeader: "ผลลัพธ์: การชิงทรัพยากรคืน (Preemption)"
    },
    expanded: {
        status: "สถานะ: ปลดล็อคได้ด้วยการเพิ่มทรัพยากร!",
        dialogue: "คุณเพิ่มผ้าห่มใหม่เข้าระบบอีกผืน! พี่หมีไม่จำเป็นต้องรอบนผ้าห่มของกระต่ายแล้ว พี่หมีจึงสามารถหยิบปิกนิกมาทำขนมจนเสร็จ แล้วปล่อยคืนตะกร้าให้เพื่อนๆ ทีละคน ทุกฝ่ายรอดพ้นอย่างปลอดภัย!",
        dialogueHeader: "ผลลัพธ์: การขยายทรัพยากร (Resource Expansion)"
    },
    killed: {
        status: "สถานะ: ปลดล็อคได้ด้วยการจัดคิว/ปิดบางราย!",
        dialogue: "ขอน้องกระต่ายหลับพักผ่อนชั่วคราว (สั่งยกเลิกโปรเซส) น้องกระต่ายยอมวางผ้าห่มลง ทำให้พี่หมีได้ผ้าห่มไปทำจนเสร็จก่อน ปลดคิวให้คนอื่นๆ ทำงานลุล่วงตามลำดับความปลอดภัย (Safe Sequence) แล้วจึงปลุกกระต่ายกลับมารันใหม่!",
        dialogueHeader: "ผลลัพธ์: การยกเลิกโปรเซส (Process Termination)"
    }
};

function initGame() {
    resetGameVisuals();
    
    // Action buttons listeners
    document.getElementById("btn-action-preempt").addEventListener("click", () => {
        applyGameAction("preempted");
    });
    
    document.getElementById("btn-action-expand").addEventListener("click", () => {
        applyGameAction("expanded");
    });
    
    document.getElementById("btn-action-kill").addEventListener("click", () => {
        applyGameAction("killed");
    });
    
    document.getElementById("btn-restart-game").addEventListener("click", () => {
        resetGameVisuals();
    });
}

function applyGameAction(actionKey) {
    const state = gameStates[actionKey];
    
    document.getElementById("game-status-label").textContent = state.status;
    document.getElementById("game-status-label").style.backgroundColor = "#81B29A";
    document.getElementById("game-status-label").style.color = "#FFF";
    
    document.getElementById("dialogue-name").textContent = state.dialogueHeader;
    document.getElementById("dialogue-text").textContent = state.dialogue;
    
    // Remove active markers from buttons
    document.querySelectorAll(".btn-game-action").forEach(btn => btn.classList.remove("active-act"));
    
    if (actionKey === "preempted") {
        document.getElementById("btn-action-preempt").classList.add("active-act");
        animatePreemption();
    } else if (actionKey === "expanded") {
        document.getElementById("btn-action-expand").classList.add("active-act");
        animateExpansion();
    } else if (actionKey === "killed") {
        document.getElementById("btn-action-kill").classList.add("active-act");
        animateKilled();
    }
}

function resetGameVisuals() {
    const statusLabel = document.getElementById("game-status-label");
    statusLabel.textContent = gameStates.locked.status;
    statusLabel.style.backgroundColor = "rgba(224, 122, 95, 0.1)";
    statusLabel.style.color = "#E07A5F";
    
    document.getElementById("dialogue-name").textContent = gameStates.locked.dialogueHeader;
    document.getElementById("dialogue-text").textContent = gameStates.locked.dialogue;
    
    document.querySelectorAll(".btn-game-action").forEach(btn => btn.classList.remove("active-act"));
    document.getElementById("game-overlay").classList.remove("active");
    
    // Restore default positions and classes of SVGs
    const bear = document.getElementById("char-bear");
    const rabbit = document.getElementById("char-rabbit");
    const squirrel = document.getElementById("char-squirrel");
    const itemBasket = document.getElementById("item-basket");
    const itemBlanket = document.getElementById("item-blanket");
    const itemThermos = document.getElementById("item-thermos");
    
    bear.setAttribute("transform", "translate(225, 80)");
    bear.setAttribute("class", "animal-node");
    rabbit.setAttribute("transform", "translate(325, 240)");
    rabbit.setAttribute("class", "animal-node");
    squirrel.setAttribute("transform", "translate(125, 240)");
    squirrel.setAttribute("class", "animal-node");
    
    itemBasket.setAttribute("transform", "translate(160, 160)");
    itemBlanket.setAttribute("transform", "translate(290, 160)");
    itemThermos.setAttribute("transform", "translate(225, 240)");
    
    // Default color values for path arrows
    document.getElementById("path-bear-basket").setAttribute("stroke", "#81B29A");
    document.getElementById("path-bear-blanket").setAttribute("stroke", "#E07A5F");
    document.getElementById("path-rabbit-blanket").setAttribute("stroke", "#81B29A");
    document.getElementById("path-rabbit-thermos").setAttribute("stroke", "#E07A5F");
    document.getElementById("path-squirrel-thermos").setAttribute("stroke", "#81B29A");
    document.getElementById("path-squirrel-basket").setAttribute("stroke", "#E07A5F");
    
    // Remove extra blanket if any
    const extraBlanket = document.getElementById("extra-blanket-r");
    if (extraBlanket) extraBlanket.remove();
}

function animatePreemption() {
    const basket = document.getElementById("item-basket");
    const squirrel = document.getElementById("char-squirrel");
    
    // Animate Basket flying from Bear to Squirrel
    basket.setAttribute("transform", "translate(125, 200)");
    document.getElementById("path-bear-basket").setAttribute("stroke", "#E07A5F");
    document.getElementById("path-squirrel-basket").setAttribute("stroke", "#81B29A");
    
    setTimeout(() => {
        squirrel.setAttribute("class", "animal-node working");
        setTimeout(() => {
            showWinOverlay("สำเร็จ (Preemption)!", "การทวงคืนทรัพยากรโดยระบบปฏิบัติการ ช่วยแบ่งเบาให้โปรเซสที่พร้อมสามารถทำงานเสร็จสมบูรณ์ทีละส่วนได้สำเร็จ!");
        }, 1800);
    }, 500);
}

function animateExpansion() {
    const gameSvg = document.getElementById("game-svg");
    const bear = document.getElementById("char-bear");
    
    // Add a new Blanket next to Bear
    const extraBlanket = document.createElementNS("http://www.w3.org/2000/svg", "g");
    extraBlanket.setAttribute("id", "extra-blanket-r");
    extraBlanket.setAttribute("transform", "translate(225, 140) scale(0)");
    extraBlanket.innerHTML = `
        <rect x="-15" y="-15" width="30" height="30" rx="4" fill="#81B29A" stroke="#FFF" stroke-width="2" />
        <text x="0" y="5" font-family="sans-serif" font-size="10" fill="#FFF" text-anchor="middle">🛋️</text>
    `;
    gameSvg.appendChild(extraBlanket);
    
    // Scale up expansion blanket
    setTimeout(() => {
        extraBlanket.setAttribute("transform", "translate(225, 140) scale(1)");
        extraBlanket.style.transition = "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        
        document.getElementById("path-bear-blanket").setAttribute("stroke", "#81B29A");
        bear.setAttribute("class", "animal-node working");
        
        setTimeout(() => {
            showWinOverlay("สำเร็จ (Resource Expansion)!", "การเพิ่มสิทธิ์หรือทรัพยากรสำรองลงในเซิร์ฟเวอร์ ช่วยป้องกันการติดหล่มงานที่แย่งกันใช้งานได้อย่างดีเลิศ!");
        }, 1800);
    }, 100);
}

function animateKilled() {
    const rabbit = document.getElementById("char-rabbit");
    const blanket = document.getElementById("item-blanket");
    const bear = document.getElementById("char-bear");
    
    rabbit.setAttribute("class", "animal-node sleeping");
    blanket.setAttribute("transform", "translate(225, 120)");
    
    setTimeout(() => {
        document.getElementById("path-bear-blanket").setAttribute("stroke", "#81B29A");
        bear.setAttribute("class", "animal-node working");
        
        setTimeout(() => {
            showWinOverlay("สำเร็จ (Termination)!", "การยกเลิกกระบวนงานที่แย่งชิงสิทธิ์ หรือเคลียร์สิทธิ์ของบางโปรเซสทิ้ง เพื่อคืนพื้นที่ทรัพยากรหลักกลับสู่ระบบส่วนกลาง");
        }, 1800);
    }, 600);
}

function showWinOverlay(title, desc) {
    const overlay = document.getElementById("game-overlay");
    document.getElementById("overlay-title").textContent = title;
    document.getElementById("overlay-desc").textContent = desc;
    overlay.classList.add("active");
}


// --- 3. Interactive Quiz Controller ---
const quizQuestions = [
    {
        question: "คำถามที่ 1: ข้อใดต่อไปนี้เปรียบเปรยถึงนิยามของสภาวะ Deadlock (วงจรอับ) ได้ถูกต้องที่สุดในชีวิตจริง?",
        options: [
            "ก. ถนนสองเลนโล่งๆ รถแล่นผ่านสบายไม่มีสะดุด",
            "ข. การรอต่อแถวเพื่อพิมพ์เอกสารตามลำดับบัตรคิว",
            "ค. รถสองคันแล่นสวนกันบนสะพานแคบเลนเดียว และจอดหยุดนิ่งต่างคนต่างรอให้อีกฝ่ายถอยหลบทาง",
            "ง. เครื่องคอมพิวเตอร์ประมวลผลเร็วขึ้นเพราะอัปเดตแรมใหม่"
        ],
        correct: 2,
        feedback: "ถูกต้องจ้า! รถจอดเผชิญหน้าบนสะพานแคบเปรียบเหมือนโปรเซสที่ถือของและต้องการทางเดินต่อ แต่ต่างฝ่ายต่างขัดขวางกันเองจนขยับไม่ได้"
    },
    {
        question: "คำถามที่ 2: เงื่อนไขเดดล็อกข้อใดในกฎ Coffman หมายถึง 'โปรเซสถือครองบางสิทธิ์ไว้แล้ว และร้องขอชิ้นใหม่เพิ่ม'?",
        options: [
            "ก. Mutual Exclusion (สิทธิ์ผู้เดียว)",
            "ข. No Preemption (ห้ามบังคับชิง)",
            "ค. Hold and Wait (ถือครองและรอคอย)",
            "ง. Circular Wait (รอลูปวงกลม)"
        ],
        correct: 2,
        feedback: "เก่งมาก! Hold and Wait (ถือครองและรอคอย) คือสิ่งที่กระตุ้นให้ระบบเกิดปัญหา เพราะถือครองของเก่าไว้ ไม่ยอมวาง และขอของชิ้นใหม่ต่อ"
    },
    {
        question: "คำถามที่ 3: วิธีใดคือการกู้คืน (Recovery) เมื่อระบบตรวจพบว่าเกิดวงจรอับ (Deadlock) ขึ้นแล้ว?",
        options: [
            "ก. ปล่อยทิ้งไว้เรื่อยๆ เพื่อให้อุณหภูมิเครื่องอุ่นขึ้น",
            "ข. สั่งยุติการทำงานของโปรเซสหนึ่ง (Process Termination) หรือแย่งคืนทรัพยากร (Preemption)",
            "ค. โหลดโปรแกรมเพิ่มเติมพร้อมกันร้อยแอปพลิเคชัน",
            "ง. การใช้อัลกอริทึมของธนาคารเพื่อจำลองล่วงหน้า"
        ],
        correct: 1,
        feedback: "ยอดเยี่ยมมาก! เมื่อเกิดล็อคแล้ว ทางแก้ไขกู้คืนคือการ Preempt (ริบคืนสิทธิ์) หรือ Abort/Terminate (ทำลายกระบวนการนั้นทิ้งชั่วคราว)"
    }
];

let currentQuizIndex = 0;
let score = 0;

function renderQuizQuestion() {
    const questionText = document.getElementById("quiz-question-text");
    const optionsContainer = document.getElementById("quiz-options-container");
    const feedbackText = document.getElementById("quiz-feedback-text");
    
    if (!questionText || !optionsContainer) return;
    
    feedbackText.textContent = "";
    feedbackText.className = "quiz-feedback";
    
    // Check if quiz is finished
    if (currentQuizIndex >= quizQuestions.length) {
        questionText.textContent = `ยินดีด้วย! คุณตอบคำถามครบทั้งหมดแล้ว 🎉`;
        optionsContainer.innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <p style="font-size: 1.5rem; font-weight:700; color:var(--accent-terracotta); margin-bottom:16px;">
                    คุณได้คะแนน ${score} / ${quizQuestions.length} คะแนน!
                </p>
                <p style="color:var(--text-muted); margin-bottom: 24px;">คุณคือผู้เชี่ยวชาญการจัดสรรระบบทรัพยากรระบบปฏิบัติการตัวจริง!</p>
                <button class="btn" onclick="restartQuiz()">ทำแบบทดสอบอีกครั้ง</button>
            </div>
        `;
        return;
    }
    
    const qData = quizQuestions[currentQuizIndex];
    questionText.textContent = qData.question;
    optionsContainer.innerHTML = "";
    
    qData.options.forEach((optText, index) => {
        const button = document.createElement("button");
        button.className = "btn-option";
        button.textContent = optText;
        button.addEventListener("click", () => handleOptionClick(index, button));
        optionsContainer.appendChild(button);
    });
}

function handleOptionClick(selectedIndex, buttonElement) {
    const qData = quizQuestions[currentQuizIndex];
    const optionsContainer = document.getElementById("quiz-options-container");
    const feedbackText = document.getElementById("quiz-feedback-text");
    
    // Disable all options once answered
    const allButtons = optionsContainer.querySelectorAll(".btn-option");
    allButtons.forEach(btn => btn.disabled = true);
    
    if (selectedIndex === qData.correct) {
        buttonElement.classList.add("correct");
        feedbackText.textContent = `✓ ${qData.feedback}`;
        feedbackText.style.color = "#3F5E4D";
        score++;
    } else {
        buttonElement.classList.add("incorrect");
        // Highlight correct one
        allButtons[qData.correct].classList.add("correct");
        feedbackText.textContent = `✗ คำตอบยังไม่ถูกนะ... เฉลยคือข้อ ${qData.options[qData.correct].substring(0, 2)}`;
        feedbackText.style.color = "#8C402E";
    }
    
    // Proceed to next question after delay
    setTimeout(() => {
        currentQuizIndex++;
        renderQuizQuestion();
    }, 3500);
}

function restartQuiz() {
    currentQuizIndex = 0;
    score = 0;
    renderQuizQuestion();
}


// --- 4. Initialization on Dom Loaded ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. RAG Setup
    drawRagEdges();
    
    document.getElementById("btn-next-rag").addEventListener("click", () => {
        if (currentRagStep < ragSteps.length - 1) {
            currentRagStep++;
            drawRagEdges();
        }
    });
    
    document.getElementById("btn-prev-rag").addEventListener("click", () => {
        if (currentRagStep > 0) {
            currentRagStep--;
            drawRagEdges();
        }
    });
    
    // 2. Game Setup
    initGame();
    
    // 3. Quiz Setup
    renderQuizQuestion();
    
    // Smooth Scroll Active Nav Link Highlight
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll("nav a");
    
    window.addEventListener("scroll", () => {
        let current = "";
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - 150)) {
                current = section.getAttribute("id");
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("href").includes(current)) {
                link.classList.add("active");
            }
        });
    });
});
