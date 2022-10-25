import formatXML from 'xml-formatter';

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

export function updateASI(
  asiXmlRef,
  {
    comments
  }
) {
  const doc = parseXML(asiXmlRef);

  const commentDefsNode = getOrCreateNode(
    doc,
    ['ALGORITHM', 'DEFINITIONS', 'COMMENT_DEFINITIONS'],
    doc
  );
  const mutCommentsNode = getOrCreateNode(
    doc,
    ['ALGORITHM', 'MUTATION_COMMENTS']
  );
  const resultCommentsNode = getOrCreateNode(
    doc,
    ['ALGORITHM', 'RESULT_COMMENTS']
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
