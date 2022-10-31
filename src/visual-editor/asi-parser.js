import nearley from 'nearley';
import formatXML from 'xml-formatter';

import asiRules from './asi-rules';

const XPATH_EVALUATOR = new XPathEvaluator();


function parseXML(xmlText) {
  const parser = new DOMParser();
  return parser.parseFromString(xmlText, 'application/xml');
}


function serializeXML(doc) {
  const serializer = new XMLSerializer();
  return formatXML(
    serializer.serializeToString(doc),
    {
      indentation: '  ',
      collapseContent: true
    }
  );
}


function queryNodes(parent, xpath) {
  const result = XPATH_EVALUATOR.evaluate(xpath, parent);
  const nodes = [];
  let child;
  do {
    child = result.iterateNext();
    if (!child) {
      break;
    }
    nodes.push(child);
  } while (child);

  return nodes;
}


function getOrCreateNode(parent, tagNames, doc) {
  let curNode = parent;
  for (const tagName of tagNames) {
    const nodes = queryNodes(curNode, tagName);
    if (nodes.length > 0) {
      curNode = nodes[0];
    }
    else {
      const childNode = doc.createElement(tagName);
      curNode.appendChild(childNode);
      curNode = childNode;
    }
  }
  return curNode;
}


function createNode(parent, tagNames, doc) {
  let curNode = parent;
  for (const tagName of tagNames) {
    const childNode = doc.createElement(tagName);
    curNode.appendChild(childNode);
    curNode = childNode;
  }
  return curNode;
}


function querySingleNodeText(parent, xpath) {
  const nodes = queryNodes(parent, xpath);
  return nodes.length === 0 ? undefined : nodes[0].textContent.trim();
}


function makeDrugLookup(doc) {
  const geneNodes = queryNodes(doc, 'ALGORITHM/DEFINITIONS/GENE_DEFINITION');
  const dcNodes = queryNodes(doc, 'ALGORITHM/DEFINITIONS/DRUGCLASS');
  const dcGeneLookup = {};
  for (const geneNode of geneNodes) {
    const gene = querySingleNodeText(geneNode, 'NAME');
    const dcList = querySingleNodeText(
      geneNode,
      'DRUGCLASSLIST'
    ).split(/\s*,+\s*/g);
    for (const dc of dcList) {
      if (dc) {
        dcGeneLookup[dc] = gene;
      }
    }
  }
  const drugLookup = {};
  for (const dcNode of dcNodes) {
    const dc = querySingleNodeText(dcNode, 'NAME');
    const drugList = querySingleNodeText(dcNode, 'DRUGLIST').split(/\s*,+\s*/g);
    for (const drug of drugList) {
      if (drug) {
        drugLookup[drug] = {
          drug,
          drugClass: dc,
          gene: dcGeneLookup[dc]
        };
      }
    }
  }
  return drugLookup;
}


export function parseRule(ruleText) {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(asiRules));
  parser.feed(ruleText);
  return parser.results[0];
}


function stringifyRule(rule, depth = 0) {
  const indent = '  '.repeat(depth);
  switch (rule.op) {
    case 'RESIDUE_MATCH':
      return `${rule.ref ? rule.ref : ''}${rule.pos}${rule.aas}`;
    case 'RESIDUE_NOT':
      return `NOT ${rule.ref ? rule.ref : ''}${rule.pos}${rule.aas}`;
    case 'RESIDUE_INVERT':
      return `${rule.ref ? rule.ref : ''}${rule.pos} (NOT ${rule.aas})`;
    case 'AND':
    case 'OR': {
      const leftText = stringifyRule(rule.leftCond, depth + 1);
      let rightText = stringifyRule(rule.rightCond, depth + 1);
      const rightOp = rule.rightCond.op;
      if (rightOp === 'AND' || rightOp === 'OR') {
        rightText = `(${rightText})`;
      }
      return `${leftText} ${rule.op} ${rightText}`;
    }
    case 'EXCLUDE':
      return `EXCLUDE ${stringifyRule(rule.cond, depth + 1)}`;
    case 'SELECT':
      return `SELECT ${
        stringifyRule(rule.cond)
      } FROM (${rule.from.map(r => stringifyRule(r, depth + 1)).join(', ')})`;
    case 'SCORE':
      return `SCORE FROM (\n${
        rule.scores.map(r => stringifyRule(r, depth + 1)).join(',\n')
      }\n)`;
    case 'MAP':
      return `${indent}${
        stringifyRule(rule.cond, depth + 1)
      } => ${rule.score}`;
    case 'MAX_MAP':
      return `${indent}MAX(${
        rule.scores.map(r => stringifyRule(r, 0)).join(', ')
      })`;
    default:
      return null;
  }
}


function getScoreMap(scores) {
  const map = [];
  for (const score of scores) {
    if (score.op === 'MAP') {
      map.push({
        ruleText: stringifyRule(score.cond),
        score: score.score
      });
    }
    else { // score.op === 'MAX_MAP'
      map.push(...getScoreMap(score.scores));
    }
  }
  return map;
}


export function rulesFromASI(asiXml) {
  const doc = parseXML(asiXml);
  const drugLookup = makeDrugLookup(doc);
  const drugs = queryNodes(doc, 'ALGORITHM/DRUG');
  const allRows = {};
  for (const drugNode of drugs) {
    const drugName = querySingleNodeText(drugNode, 'NAME');
    const drugClass = drugLookup[drugName]?.drugClass;
    if (!drugClass) {
      continue;
    }
    if (!(drugClass in allRows)) {
      allRows[drugClass] = {};
    }
    const rows = allRows[drugClass];
    const rules = queryNodes(drugNode, 'RULE');
    for (const ruleNode of rules) {
      const ruleText = querySingleNodeText(ruleNode, 'CONDITION');
      const rule = parseRule(ruleText);

      if (rule.op === 'SCORE') {
        for (const {ruleText, score} of getScoreMap(rule.scores)) {
          if (!(ruleText in rows)) {
            rows[ruleText] = {rule: ruleText};
          }
          rows[ruleText][`${drugName} Score`] = score;
        }
      }
      else {
        const level = querySingleNodeText(ruleNode, 'ACTIONS/LEVEL');
        if (!(ruleText in rows)) {
          rows[ruleText] = {rule: ruleText};
        }
        rows[ruleText][`${drugName} Level`] = level;
      }
    }
  }
  return Object.entries(allRows).map(([drugClass, rows]) => ({
    drugClass,
    rules: Object.values(rows)
  }));
}


export function commentsFromASI(asiXml) {
  const doc = parseXML(asiXml);
  const drugLookup = makeDrugLookup(doc);

  const commentDefs = queryNodes(
    doc,
    'ALGORITHM/DEFINITIONS/COMMENT_DEFINITIONS/COMMENT_STRING'
  );
  const geneMutComments = queryNodes(
    doc,
    'ALGORITHM/MUTATION_COMMENTS/GENE'
  );
  const resultComments = queryNodes(
    doc,
    'ALGORITHM/RESULT_COMMENTS/RESULT_COMMENT_RULE'
  );

  const comments = {};
  for (const cmtNode of commentDefs) {
    const cmtId = cmtNode.id;
    const comment = {
      id: cmtId,
      text: querySingleNodeText(cmtNode, 'TEXT'),
      sortTag: querySingleNodeText(cmtNode, 'SORT_TAG')
    };
    for (const childNode of cmtNode.childNodes) {
      if (childNode.nodeType === Node.COMMENT_NODE) {
        const extraNodes = parseXML(childNode.textContent);
        const date = querySingleNodeText(extraNodes, 'DATE');
        if (date) {
          comment.date = date;
        }
        const drugClass = querySingleNodeText(extraNodes, 'DRUGCLASS');
        if (drugClass) {
          comment.drugClass = drugClass;
        }
      }
    }
    comments[cmtId] = comment;

  }

  for (const geneCmtsNode of geneMutComments) {
    const gene = querySingleNodeText(geneCmtsNode, 'NAME');

    for (const ruleNode of queryNodes(geneCmtsNode, 'RULE')) {
      const condition = querySingleNodeText(ruleNode, 'CONDITION');
      const cmtId = querySingleNodeText(ruleNode, 'ACTIONS/COMMENT/@ref');
      if (cmtId in comments) {
        comments[cmtId].gene = gene;
        comments[cmtId].condition = condition;
        comments[cmtId].conditionType = 'MUTATION';
      }
    }
  }

  for (const resultCmtNode of resultComments) {
    const cmtId = querySingleNodeText(
      resultCmtNode,
      'LEVEL_ACTION/COMMENT/@ref'
    );
    const levelConds = queryNodes(
      resultCmtNode,
      'DRUG_LEVEL_CONDITIONS/DRUG_LEVEL_CONDITION'
    );
    const genes = {};
    const drugClasses = {};
    const conditions = [];
    for (const levelCond of levelConds) {
      const drug = querySingleNodeText(levelCond, 'DRUG_NAME');
      const drugDef = drugLookup[drug];
      if (drugDef) {
        genes[drugDef.gene] = 1;
        drugClasses[drugDef.drugClass] = 1;
      }
      let level;
      for (const [tagName, op] of [
        ['LTE', '<='],
        ['GTE', '>='],
        ['LT', '<'],
        ['GT', '>'],
        ['EQ', '='],
        ['NEQ', '!=']
      ]) {
        level = querySingleNodeText(levelCond, tagName);
        if (level !== undefined) {
          conditions.push(`${drug}${op}${level}`);
          break;
        }
      }
    }
    if (cmtId in comments) {
      comments[cmtId].condition = conditions.join(' AND ');
      comments[cmtId].gene = Object.keys(genes).join(',');
      comments[cmtId].drugClass = Object.keys(drugClasses).join(',');
      comments[cmtId].conditionType = 'DRUGLEVEL';
    }
  }

  return Object.values(comments);
}


function getPosKey(cond) {
  switch (cond.op) {
    case 'RESIDUE_MATCH':
    case 'RESIDUE_NOT':
    case 'RESIDUE_INVERT':
      return `${cond.op} ${cond.pos}`;
    case 'AND':
    case 'OR': {
      const children = [
        getPosKey(cond.leftCond),
        getPosKey(cond.rightCond)
      ].sort();
      return `${cond.op} ${children.join(',')}`;
    }
    case 'EXCLUDE':
      return `EXCLUDE ${getPosKey(cond)}`;
    case 'SELECT': {
      const children = cond.from.map(getPosKey).sort();
      return `SELECT ${stringifyRule(cond.cond)} ${children.join(',')}`;
    }
    default:
      return null;
  }
}


function updateDrugRules(
  drugName,
  drugNode,
  rules,
  doc
) {
  if (`${drugName} Score` in rules[0]) {
    const scoreMap = {};
    for (const rule of rules) {
      const ruleText = rule.rule;
      const score = Number.parseFloat(rule[`${drugName} Score`]);
      const ruleCond = parseRule(ruleText);
      if (isNaN(score)) {
        continue;
      }
      const mapCond = {op: 'MAP', cond: ruleCond, score};
      const posKey = getPosKey(ruleCond);
      if (posKey in scoreMap) {
        if (scoreMap[posKey].op === 'MAP') {
          scoreMap[posKey] = {
            op: 'MAX_MAP',
            scores: [scoreMap[posKey]]
          };
        }
        scoreMap[posKey].scores.push(mapCond);
      }
      else {
        scoreMap[posKey] = mapCond;
      }
    }
    const ruleText = stringifyRule({
      op: 'SCORE',
      scores: Object.values(scoreMap)
    });
    let ruleNode = queryNodes(drugNode, 'RULE');
    if (ruleNode.length === 1) {
      ruleNode = ruleNode[0];
    }
    else {
      ruleNode.forEach(child => drugNode.removeChild(child));
      ruleNode = createNode(drugNode, ['RULE'], doc);
    }
    const condNode = getOrCreateNode(ruleNode, ['CONDITION'], doc);
    condNode.replaceChildren();
    condNode.appendChild(doc.createCDATASection(ruleText));
    if (queryNodes(ruleNode, 'ACTIONS').length === 0) {
      createNode(ruleNode, ['ACTIONS', 'SCORERANGE', 'USE_GLOBALRANGE'], doc);
    }
  }
  else if (`${drugName} Level` in rules[0]) {
    drugNode.replaceChildren();
    for (const rule of rules) {
      const level = Number.parseInt(rule[`${drugName} Level`]);
      if (isNaN(level)) {
        continue;
      }
      const ruleNode = createNode(drugNode, ['RULE'], doc);
      const condNode = createNode(ruleNode, ['CONDITION'], doc);
      condNode.appendChild(doc.createCDATASection(rule.rule));
      const levelNode = createNode(ruleNode, ['ACTIONS', 'LEVEL'], doc);
      levelNode.textContent = level;
    }
  }

}


export function updateASIRules(
  asiXmlRef,
  drugClass,
  rules
) {
  const doc = parseXML(asiXmlRef);
  const drugLookup = makeDrugLookup(doc);
  const pendingDrugs = {};
  for (const drugCol of Object.keys(rules[0])) {
    if (/ (Score|Level)$/.test(drugCol)) {
      pendingDrugs[drugCol.replace(/ (Score|Level)$/, '')] = true;
    }
  }

  const algNode = getOrCreateNode(doc, ['ALGORITHM'], doc);
  const drugs = queryNodes(algNode, 'DRUG');

  for (const drugNode of drugs) {
    const drugName = querySingleNodeText(drugNode, 'NAME');
    if (drugName in pendingDrugs) {
      updateDrugRules(drugName, drugNode, rules, doc);
      pendingDrugs[drugName] = false;
    }
    else if (drugLookup[drugName]?.drugClass === drugClass) {
      drugNode.remove();
    }
  }

  for (const drugName in pendingDrugs) {
    if (pendingDrugs[drugName]) {
      const drugNode = createNode(algNode, ['DRUG'], doc);
      const nameNode = createNode(drugNode, ['NAME'], doc);
      nameNode.textContent = drugName;
      updateDrugRules(drugName, drugNode, rules, doc);
      pendingDrugs[drugName] = false;
    }
  }

  return serializeXML(doc);
}


export function updateASIComments(
  asiXmlRef,
  comments
) {
  const doc = parseXML(asiXmlRef);

  const commentDefsNode = getOrCreateNode(
    doc,
    ['ALGORITHM', 'DEFINITIONS', 'COMMENT_DEFINITIONS'],
    doc
  );
  const mutCommentsNode = getOrCreateNode(
    doc,
    ['ALGORITHM', 'MUTATION_COMMENTS'],
    doc
  );
  const resultCommentsNode = getOrCreateNode(
    doc,
    ['ALGORITHM', 'RESULT_COMMENTS'],
    doc
  );

  // clear children
  commentDefsNode.replaceChildren();
  mutCommentsNode.replaceChildren();
  resultCommentsNode.replaceChildren();

  const geneNodeLookup = {};

  for (const comment of comments) {
    const cmtDefNode = doc.createElement('COMMENT_STRING');
    cmtDefNode.setAttribute('id', comment.id);
    if (comment.date) {
      cmtDefNode.appendChild(
        doc.createComment(`<DATE>${comment.date}</DATE>`)
      );
    }
    if (comment.drugClass) {
      cmtDefNode.appendChild(
        doc.createComment(`<DRUGCLASS>${comment.drugClass}</DRUGCLASS>`)
      );
    }
    const textNode = doc.createElement('TEXT');
    textNode.appendChild(doc.createCDATASection(comment.text));
    cmtDefNode.appendChild(textNode);

    if (comment.sortTag) {
      const sortTagNode = doc.createElement('SORT_TAG');
      sortTagNode.textContent = comment.sortTag;
      cmtDefNode.appendChild(sortTagNode);
    }
    commentDefsNode.appendChild(cmtDefNode);

    if (comment.conditionType === 'MUTATION') {
      const gene = comment.gene;
      let geneNode;
      if (gene in geneNodeLookup) {
        geneNode = geneNodeLookup[gene];
      }
      else {
        geneNode = doc.createElement('GENE');
        const geneNameNode = doc.createElement('NAME');
        geneNameNode.textContent = gene;
        geneNode.appendChild(geneNameNode);
        mutCommentsNode.appendChild(geneNode);
        geneNodeLookup[gene] = geneNode;
      }
      const ruleNode = doc.createElement('RULE');
      const condNode = doc.createElement('CONDITION');
      condNode.textContent = comment.condition;
      ruleNode.appendChild(condNode);
      const actionsNode = doc.createElement('ACTIONS');
      const commentRefNode = doc.createElement('COMMENT');
      commentRefNode.setAttribute('ref', comment.id);
      actionsNode.appendChild(commentRefNode);
      ruleNode.appendChild(actionsNode);
      geneNode.appendChild(ruleNode);
    }

    if (comment.conditionType === 'DRUGLEVEL') {
      const ruleNode = doc.createElement('RESULT_COMMENT_RULE');
      if (comment.condition) {
        const condsNode = doc.createElement('DRUG_LEVEL_CONDITIONS');
        for (const cond of comment.condition.split(/\s+AND\s+/gi)) {
          const [drug, op, level] = cond.split(/(>=?|<=?|=|!=)/, 3);
          const condNode = doc.createElement('DRUG_LEVEL_CONDITION');

          const drugNode = doc.createElement('DRUG_NAME');
          drugNode.textContent = drug;
          condNode.appendChild(drugNode);

          const tagName = {
            '<=': 'LTE',
            '>=': 'GTE',
            '<': 'LT',
            '>': 'GT',
            '=': 'EQ',
            '!=': 'NEQ'
          }[op];
          const opNode = doc.createElement(tagName);
          opNode.textContent = level;
          condNode.appendChild(opNode);
          condsNode.appendChild(condNode);
        }
        ruleNode.appendChild(condsNode);
      }
      const actionNode = doc.createElement('LEVEL_ACTION');
      const commentRefNode = doc.createElement('COMMENT');
      commentRefNode.setAttribute('ref', comment.id);
      actionNode.appendChild(commentRefNode);
      ruleNode.appendChild(actionNode);
      resultCommentsNode.appendChild(ruleNode);
    }
  }

  return serializeXML(doc);
}
