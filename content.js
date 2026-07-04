// AI Overview text patterns for different languages
const AI_OVERVIEW_PATTERNS = [
  /übersicht mit ki/i, // de
  /ai overview/i, // en
  /prezentare generală generată de ai/i, // ro
  /AI による概要/, // ja
  /Обзор от ИИ/, // ru
  /AI 摘要/, // zh-TW
  /AI-overzicht/i, // nl
  /AI-oversigt/i, // da
  /Vista creada con IA/i, // es
  /Přehled od AI/i, // cz
  /Aperçu IA/i, // fr
];

// Main DOM selectors
const DOM_SELECTORS = {
  HEADER_TABS: "div#hdtb-sc > div",
  MAIN_ELEMENT: '[role="main"]',
  PEOPLE_ALSO_ASK: "div.related-question-pair",
  TABS_LIST: '[role="list"]',
};

// CSS values
const CSS_VALUES = {
  HIDDEN: "none",
  HEADER_PADDING: "12px",
  MAIN_MARGIN: "24px",
};

// Tab patterns
const TAB_PATTERNS = {
  AI_MODE: /^AI Mode$/i,
};

function getAllAIOverviewContainers() {
  const containers = new Set();

  const getContainer = (element) => {
    if (!element) return null;
    
    // 1st priority: Known stable AI attributes or specific controllers (Fast Path)
    const primaryWrapper = element.closest('[data-aim="1"], [jscontroller="EYwa3d"], #Odp5De');
    if (primaryWrapper) return primaryWrapper;
    
    // 2nd priority: Find the nearest search block boundary
    const block = element.closest('[data-hveid], [jscontroller]');
    if (block) {
      // PROTECT NON-AI WIDGETS:
      // aZyy4e = Currency Converter, GCPuBe = Calculator, data-exchange-rate = Converter data
      if (
        block.hasAttribute('data-exchange-rate') || 
        block.getAttribute('jscontroller') === 'aZyy4e' ||
        block.getAttribute('jscontroller') === 'GCPuBe'
      ) {
        return null; // Abort hiding! We accidentally hit a useful widget.
      }
      return block;
    }
    
    return element.parentElement?.parentElement || element.parentElement;
  };

  // 1. Check known AI container attributes or IDs
  const directContainers = document.querySelectorAll('[data-aim="1"], [jscontroller="EYwa3d"], #Odp5De');
  directContainers.forEach(el => containers.add(el));

  // 2. Check Semantic Headings
  const headings = document.querySelectorAll('div[role="heading"], h1, h2');
  headings.forEach(el => {
    const text = el.textContent.trim();
    if (AI_OVERVIEW_PATTERNS.some((pattern) => pattern.test(text))) {
      const container = getContainer(el);
      if (container) containers.add(container);
    }
  });

  // 3. Check for the "Generating" progress bar
  const progressBars = document.querySelectorAll('[role="progressbar"][aria-label="Generating"]');
  progressBars.forEach(el => {
    const container = getContainer(el);
    if (container) containers.add(container);
  });

  // 4. Check for known hidden fallback/error states
  const spans = document.querySelectorAll('span');
  spans.forEach(el => {
    const text = el.textContent || "";
    if (
      text.includes('An AI Overview is not available for this search') || 
      text.includes("Can't generate an AI overview right now")
    ) {
      const container = getContainer(el);
      if (container) containers.add(container);
    }
  });

  return Array.from(containers);
}

// --- FIXED: THINGS TO KNOW ---
// Replaced the dangerous `[data-maindata]` selector with a safe semantic check
const getThingsToKnow = () => {
  const headings = document.querySelectorAll('h2');
  for (const h2 of headings) {
    if (h2.textContent.trim().toLowerCase() === 'things to know') {
      // Climb to the nearest hveid block to hide the whole section cleanly
      return h2.closest('[data-hveid]') || h2.parentElement?.parentElement;
    }
  }
  return null;
};

// --- PAA AI TAB LOGIC ---
const isAiOverviewPaaTab = (el) => {
  if (!el || !el.matches("div.related-question-pair")) return false;
  if (el.querySelector('[data-subtree~="aimc"], [data-subtree="aimc"]')) return true;
  if (el.querySelector('[data-subtree="aimfl,mfl"], [data-subtree="aimfl"]')) return true;
  
  if (AI_OVERVIEW_PATTERNS.some((pattern) => pattern.test(el.innerText))) {
    return true;
  }
  return false;
};

// --- THE MUTATION OBSERVER ---
const observer = new MutationObserver(() => {
  
  // 1. Hide Standard AI Overviews
  const aiContainers = getAllAIOverviewContainers();
  aiContainers.forEach(container => {
    if (container) container.style.display = CSS_VALUES.HIDDEN;
  });

  // 2. Hide "People also ask" AI overviews cleanly
  const peopleAlsoAskAiOverviews = Array.from(
    document.querySelectorAll(DOM_SELECTORS.PEOPLE_ALSO_ASK)
  ).filter(isAiOverviewPaaTab);
  
  peopleAlsoAskAiOverviews.forEach((el) => {
    if (el.parentElement?.parentElement) {
       el.parentElement.parentElement.style.display = CSS_VALUES.HIDDEN;
    }
  });

  // 3. Hide Things to Know (Now safe for converters!)
  const thingsToKnow = getThingsToKnow();
  if (thingsToKnow) {
    thingsToKnow.style.display = CSS_VALUES.HIDDEN;
  }

  // 4. Hide AI Mode tab
  const tabsList = document.querySelector(DOM_SELECTORS.TABS_LIST)?.children;
  if (tabsList?.length) {
    const aiModeTab = tabsList[0];
    if (TAB_PATTERNS.AI_MODE.test(aiModeTab.innerText.trim())) {
      aiModeTab.style.display = CSS_VALUES.HIDDEN;
    }
  }

  // 5. Restore layouts
  const headerTabs = document.querySelector(DOM_SELECTORS.HEADER_TABS);
  if (headerTabs) headerTabs.style.paddingBottom = CSS_VALUES.HEADER_PADDING;

  const mainElement = document.querySelector(DOM_SELECTORS.MAIN_ELEMENT);
  if (mainElement) {
    mainElement.style.marginTop = CSS_VALUES.MAIN_MARGIN;
  }
});

observer.observe(document, {
  childList: true,
  subtree: true,
});