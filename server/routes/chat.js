import { Router } from 'express';
import {
  streamText,
  createUIMessageStream,
  pipeUIMessageStreamToResponse,
  convertToModelMessages,
} from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { INVENTORY_TOOLS, SYSTEM_PROMPT } from '../tools.js';

const router = Router();

router.post('/', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }
  const modelMessages = await convertToModelMessages(messages, {
    tools: INVENTORY_TOOLS,
  });

  // Use Pollinations first when configured, so it can be used as the test provider.
  if (process.env.POLLINATIONS_API_KEY) {
    try {
      const pollinations = createOpenAI({
        apiKey: process.env.POLLINATIONS_API_KEY,
        baseURL: 'https://gen.pollinations.ai/v1',
      });
      const result = streamText({
        model: pollinations(process.env.POLLINATIONS_MODEL || 'openai/gpt-5.4-nano'),
        system: SYSTEM_PROMPT,
        messages: modelMessages,
        tools: INVENTORY_TOOLS,
        maxSteps: 5,
      });

      return pipeUIMessageStreamToResponse({
        response: res,
        stream: result.toUIMessageStream(),
      });
    } catch (err) {
      console.error('[AI Chat] Pollinations error, falling back:', err.message);
    }
  }

  // 1. Check if OpenAI API Key is configured
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const result = streamText({
        model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
        system: SYSTEM_PROMPT,
        messages: modelMessages,
        tools: INVENTORY_TOOLS,
        maxSteps: 5,
      });

      return pipeUIMessageStreamToResponse({
        response: res,
        stream: result.toUIMessageStream(),
      });
    } catch (err) {
      console.error('[AI Chat] OpenAI error, falling back:', err.message);
    }
  }

  // 2. Check if Google Gemini API Key is configured
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (geminiKey) {
    try {
      const google = createGoogleGenerativeAI({ apiKey: geminiKey });
      const result = streamText({
        model: google(process.env.GEMINI_MODEL || 'gemini-1.5-flash'),
        system: SYSTEM_PROMPT,
        messages: modelMessages,
        tools: INVENTORY_TOOLS,
        maxSteps: 5,
      });

      return pipeUIMessageStreamToResponse({
        response: res,
        stream: result.toUIMessageStream(),
      });
    } catch (err) {
      console.error('[AI Chat] Gemini error, falling back:', err.message);
    }
  }

  // 3. Built-in Local Agent Engine (Zero external API key required)
  // Handles natural language task commands against PostgreSQL directly!
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const userText = lastUserMsg
    ? typeof lastUserMsg.content === 'string'
      ? lastUserMsg.content
      : (lastUserMsg.parts ?? [])
          .filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join('')
    : '';

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.write({ type: 'start' });

      try {
        await executeLocalAgent(userText, writer);
      } catch (err) {
        writer.write({
          type: 'text-start',
          id: `txt-${Date.now()}`,
        });
        writer.write({
          type: 'text-delta',
          id: `txt-${Date.now()}`,
          delta: `Sorry, encountered an error processing your request: ${err.message}`,
        });
        writer.write({
          type: 'text-end',
          id: `txt-${Date.now()}`,
        });
      }

      writer.write({ type: 'finish' });
    },
  });

  return pipeUIMessageStreamToResponse({ response: res, stream });
});

async function executeLocalAgent(text, writer) {
  const t = text.trim();
  const lower = t.toLowerCase();
  const callId = `call-${Date.now()}`;

  // Helper to send tool execution and response
  const sendToolResult = async (toolName, args, result, replyText) => {
    writer.write({
      type: 'tool-input-available',
      toolCallId: callId,
      toolName,
      input: args,
    });
    writer.write({
      type: 'tool-output-available',
      toolCallId: callId,
      output: result,
    });

    const txtId = `txt-${Date.now()}`;
    writer.write({ type: 'text-start', id: txtId });
    writer.write({
      type: 'text-delta',
      id: txtId,
      delta: replyText,
    });
    writer.write({ type: 'text-end', id: txtId });
  };

  // 1. Restock / Receive Movement (e.g. "Add 20 units of Aurora Wireless Headphones", "Restock 10 Nimbus")
  const receiveMatch = lower.match(/(?:add|receive|restock|got)\s+(\d+)\s+(?:units?\s+of\s+)?(.+)/i);
  if (receiveMatch) {
    const qty = parseInt(receiveMatch[1], 10);
    const prodName = receiveMatch[2].replace(/to stock|in inventory|into stock/i, '').trim();
    const result = await INVENTORY_TOOLS.recordStockMovement.execute({
      productNameOrSku: prodName,
      type: 'receive',
      quantity: qty,
      reason: 'AI restock command',
      note: `Received ${qty} units via AI Copilot`,
    });

    if (result.error) {
      const txtId = `txt-${Date.now()}`;
      writer.write({ type: 'text-start', id: txtId });
      writer.write({ type: 'text-delta', id: txtId, delta: `⚠️ ${result.error}` });
      writer.write({ type: 'text-end', id: txtId });
      return;
    }

    return sendToolResult(
      'recordStockMovement',
      { productNameOrSku: prodName, type: 'receive', quantity: qty },
      result,
      `✅ **Stock Received**: Successfully added **${qty} units** to **${result.productName}** (${result.sku}).\n\n- Previous Stock: **${result.previousStock}**\n- New Stock on Hand: **${result.resultingStock} units**.`
    );
  }

  // 2. Issue / Dispatch Movement (e.g. "Issue 5 units of Halo Desk Lamp", "Dispatch 3 Pulse USB")
  const issueMatch = lower.match(/(?:issue|dispatch|send|deduct|remove)\s+(\d+)\s+(?:units?\s+of\s+)?(.+)/i);
  if (issueMatch) {
    const qty = parseInt(issueMatch[1], 10);
    const prodName = issueMatch[2].replace(/from stock|out of inventory/i, '').trim();
    const result = await INVENTORY_TOOLS.recordStockMovement.execute({
      productNameOrSku: prodName,
      type: 'issue',
      quantity: qty,
      reason: 'Customer order',
      note: `Issued ${qty} units via AI Copilot`,
    });

    if (result.error) {
      const txtId = `txt-${Date.now()}`;
      writer.write({ type: 'text-start', id: txtId });
      writer.write({ type: 'text-delta', id: txtId, delta: `⚠️ ${result.error}` });
      writer.write({ type: 'text-end', id: txtId });
      return;
    }

    return sendToolResult(
      'recordStockMovement',
      { productNameOrSku: prodName, type: 'issue', quantity: qty },
      result,
      `📦 **Stock Issued**: Successfully dispatched **${qty} units** of **${result.productName}** (${result.sku}).\n\n- Remaining Stock: **${result.resultingStock} units**.`
    );
  }

  // 3. Create Item Group (e.g. "Create item group Smart Home with code SMRT", "Add group Gaming code GAME")
  if (lower.includes('item group') || lower.includes('create group') || lower.includes('new group')) {
    const codeMatch = t.match(/code\s+([A-Z0-9]+)/i);
    const code = codeMatch ? codeMatch[1].toUpperCase() : 'GRP';
    const nameMatch = t.match(/(?:group|named)\s+([A-Za-z0-9\s&]+?)(?:\s+with\s+code|\s+code|\s*$)/i);
    const name = nameMatch ? nameMatch[1].replace(/create|add|new|item group|group/gi, '').trim() : 'New Group';

    const result = await INVENTORY_TOOLS.createItemGroup.execute({
      name: name || 'New Group',
      code: code.slice(0, 5),
      description: `Managed item group created via AI Copilot`,
      color: '#3b82f6',
    });

    if (result.error) {
      const txtId = `txt-${Date.now()}`;
      writer.write({ type: 'text-start', id: txtId });
      writer.write({ type: 'text-delta', id: txtId, delta: `⚠️ ${result.error}` });
      writer.write({ type: 'text-end', id: txtId });
      return;
    }

    return sendToolResult(
      'createItemGroup',
      { name, code },
      result,
      `🗂️ **Item Group Created**: Successfully created group **${result.group.name}** [${result.group.code}]. You can now classify products under this item group.`
    );
  }

  // 4. Low Stock Inquiry (e.g. "Which items are low in stock?", "Low stock alerts")
  if (lower.includes('low stock') || lower.includes('low in stock') || lower.includes('out of stock') || lower.includes('reorder') || lower.includes('alert')) {
    const result = await INVENTORY_TOOLS.getLowStockItems.execute({});
    const itemsList = result.items.length > 0
      ? result.items.map((it) => `- **${it.name}** (${it.sku}): **${it.quantity} on hand** (reorder threshold: ${it.reorderPoint}, shortage: ${it.shortage} units)`).join('\n')
      : '✨ All catalog items are currently above their reorder thresholds.';

    return sendToolResult(
      'getLowStockItems',
      {},
      result,
      `⚠️ **Low Stock Report**: Found **${result.totalAlerts} items** needing attention:\n\n${itemsList}`
    );
  }

  // 5. Valuation & Inventory Overview (e.g. "Show total inventory valuation", "Inventory overview", "How much stock do we have?")
  if (lower.includes('overview') || lower.includes('stats') || lower.includes('valuation') || lower.includes('total stock') || lower.includes('summary')) {
    const result = await INVENTORY_TOOLS.getInventoryOverview.execute({});
    const groupRows = result.groups
      .map((g) => `- **${g.name}** (${g.code}): ${g.item_count} items · ${g.units} units · ₹${Number(g.val).toLocaleString('en-IN')}`)
      .join('\n');

    return sendToolResult(
      'getInventoryOverview',
      {},
      result,
      `📊 **Inventory Overview**:\n\n- **Total Stock Value**: ₹${Number(result.totalValue).toLocaleString('en-IN')} (Retail)\n- **Total Units on Hand**: ${result.totalUnits.toLocaleString('en-IN')} units across ${result.totalProducts} products\n- **Low Stock Alerts**: ${result.lowStockAlerts} items\n\n**Breakdown by Item Group**:\n${groupRows}`
    );
  }

  // 6. Check stock for a specific product (e.g. "How many headphones do we have?", "Check stock for Aurora")
  if (lower.includes('check') || lower.includes('how many') || lower.includes('search') || lower.includes('find') || lower.includes('stock of')) {
    const cleanSearch = t.replace(/check|stock|for|how|many|do|we|have|in|inventory|\?/gi, '').trim();
    if (cleanSearch) {
      const result = await INVENTORY_TOOLS.checkStock.execute({ query: cleanSearch });
      if (result.products.length > 0) {
        const prodRows = result.products
          .map((p) => `- **${p.name}** (${p.sku}): **${p.quantity} units** in shelf \`${p.location}\` · ₹${p.price.toLocaleString('en-IN')} [${p.status}]`)
          .join('\n');
        return sendToolResult(
          'checkStock',
          { query: cleanSearch },
          result,
          `🔍 **Stock Check for "${cleanSearch}"**:\n\n${prodRows}`
        );
      }
    }
  }

  // 7. Update Product Price (e.g. "Update price of Aurora Wireless Headphones to 1499", "Change price of SKU WMS-01 to 2499")
  if (lower.includes('update price') || lower.includes('change price') || lower.includes('set price') || lower.includes('price of')) {
    const priceMatch = t.match(/(?:update|change|set)\s+price\s+of\s+(.+?)\s+to\s+₹?(\d+)/i);
    const priceToMatch = t.match(/price\s+of\s+(.+?)\s+is\s+₹?(\d+)/i);
    const setPriceMatch = t.match(/(?:set|make)\s+price\s+(.+?)\s+to\s+₹?(\d+)/i);
    const priceValueMatch = priceMatch || priceToMatch || setPriceMatch;
    if (priceValueMatch) {
      const prodName = priceValueMatch[1].replace(/(?:price|to|₹|rs?)/gi, '').trim();
      const newPrice = parseInt(priceValueMatch[2], 10);
      const result = await INVENTORY_TOOLS.updateProductPrice.execute({
        productNameOrSku: prodName,
        price: newPrice,
      });
      if (result.error) {
        const txtId = `txt-${Date.now()}`;
        writer.write({ type: 'text-start', id: txtId });
        writer.write({ type: 'text-delta', id: txtId, delta: `⚠️ ${result.error}` });
        writer.write({ type: 'text-end', id: txtId });
        return;
      }
      return sendToolResult(
        'updateProductPrice',
        { productNameOrSku: prodName, price: newPrice },
        result,
        `💰 **Price Updated**: Price for **${result.productName}** updated from ₹${result.oldPrice} to ₹${result.newPrice}.`
      );
    }
  }

  // 8. Create Supplier (e.g. "Add supplier Acme Corp", "Create vendor Beta Industries")
  if (lower.includes('add supplier') || lower.includes('create supplier') || lower.includes('add vendor') || lower.includes('new supplier')) {
    const nameMatch = t.match(/(?:add|create|new)\s+supplier\s+(.+?)(?:with|$)/i);
    const vendorMatch = t.match(/(?:add|create|new)\s+vendor\s+(.+?)(?:with|$)/i);
    const nameValueMatch = nameMatch || vendorMatch;
    if (nameValueMatch) {
      const supName = nameValueMatch[1].trim().replace(/(?:supplier|vendor|with)/gi, '').trim();
      const result = await INVENTORY_TOOLS.createSupplier.execute({ name: supName });
      if (result.error) {
        const txtId = `txt-${Date.now()}`;
        writer.write({ type: 'text-start', id: txtId });
        writer.write({ type: 'text-delta', id: txtId, delta: `⚠️ ${result.error}` });
        writer.write({ type: 'text-end', id: txtId });
        return;
      }
      return sendToolResult(
        'createSupplier',
        { name: result.supplier.name },
        result,
        `👥 **Supplier Added**: Supplier **"${result.supplier.name}"** added with lead time of ${result.supplier.leadTime} days.`
      );
    }
  }

  // 7. Create Product (e.g. "Create product Smart Speaker SKU SPK-01 price 2499 in Electronics")
  if (lower.includes('create product') || lower.includes('add product') || lower.includes('new product')) {
    const skuMatch = t.match(/sku\s+([A-Za-z0-9-]+)/i);
    const priceMatch = t.match(/price\s+(?:₹|rs\.?)?\s*(\d+)/i);
    const catMatch = t.match(/in\s+([A-Za-z0-9\s]+?)(?:\s+priced|\s+sku|\s*$)/i);
    const nameMatch = t.match(/(?:product|named)\s+([A-Za-z0-9\s]+?)(?:\s+sku|\s+price|\s+with|\s+in|\s*$)/i);

    const name = nameMatch ? nameMatch[1].replace(/create|add|new|product/gi, '').trim() : 'New Catalog Product';
    const sku = skuMatch ? skuMatch[1].toUpperCase() : `SKU-${Date.now().toString(36).toUpperCase()}`;
    const price = priceMatch ? parseInt(priceMatch[1], 10) : 999;
    const cat = catMatch ? catMatch[1].trim() : 'Electronics';

    const result = await INVENTORY_TOOLS.createProduct.execute({
      name,
      sku,
      categoryOrGroupName: cat,
      price,
      quantity: 10,
      reorderPoint: 5,
    });

    if (result.error) {
      const txtId = `txt-${Date.now()}`;
      writer.write({ type: 'text-start', id: txtId });
      writer.write({ type: 'text-delta', id: txtId, delta: `⚠️ ${result.error}` });
      writer.write({ type: 'text-end', id: txtId });
      return;
    }

    return sendToolResult(
      'createProduct',
      { name, sku, price, categoryOrGroupName: cat },
      result,
      `✨ **Product Created**: Successfully added **${result.product.name}** (${result.product.sku}) to **${result.product.category}** at ₹${result.product.price} with initial stock of 10 units.`
    );
  }

  // Fallback conversational reply explaining available tasks
  const txtId = `txt-${Date.now()}`;
  writer.write({ type: 'text-start', id: txtId });
  writer.write({
    type: 'text-delta',
    id: txtId,
    delta: `👋 Hi! I am your **Invmage AI Copilot**. I can execute tasks directly in PostgreSQL:\n\n` +
      `- **Restock items**: *"Add 20 units of Aurora Wireless Headphones"*\n` +
      `- **Issue stock**: *"Issue 5 units of Halo Desk Lamp"*\n` +
      `- **Check low stock**: *"Which items are low in stock?"*\n` +
      `- **Create products**: *"Create product Smart Camera with SKU CAM-01 in Electronics price 3499"*\n` +
      `- **Create item groups**: *"Create item group Smart Home with code SMRT"*\n` +
      `- **Inventory valuation**: *"Show total inventory valuation"*\n\n` +
      `💡 *Tip: To connect OpenAI GPT-4o or Google Gemini directly, configure \`OPENAI_API_KEY\` or \`GEMINI_API_KEY\` in your \`.env\` file.*`,
  });
  writer.write({ type: 'text-end', id: txtId });
}

export default router;
