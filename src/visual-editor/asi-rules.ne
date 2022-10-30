# Copyright 2022 Stanford HIVDB Team, Frontier Science & Technology Research
# Foundation
# 
# Licensed under the Apache License, Version 2.0 (the "License"); you may not
# use this file except in compliance with the License.  You may obtain a copy
# of the License at
# 
#     http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
# License for the specific language governing permissions and limitations under
# the License.
# 
# ADDITIONAL DISCLAIMER: In addition to the standard warranty exclusions and
# limitations of liability set forth in sections 7, 8 and 9 of the Apache 2.0
# license that governs the use and development of this software, Frontier
# Science & Technology Research Foundation disclaims any liability for use of
# this software for patient care or in clinical settings. This software was
# developed solely for use in medical and public health research, and was not
# intended, designed, or validated to guide patient care.


# These are the productions of the grammar. The first production is 
# used by the implicit start production.                           
# ?, * and + have the same meaning as in a regular expression.      
# 
# A production can have more than one factor.
# 
# Each alternative element can be explicitly named by preceding it 
# with a name enclosed in brackets and followed by | or a colon 
# if it is the last element in list. 

### Productions ###

asi -> ( booleancondition {% id %} | scorecondition {% id %} ) {% id %}

booleancondition -> (
    condition {% id %} |
    booleancondition logicsymbol condition {% booleancondition %}
) {% id %}

condition -> l_par booleancondition r_par {% d => d[1] %}
           | residue {% id %}
           | excludestatement {% id %}
           | selectstatement {% id %}

logicsymbol -> and {% id %} | or {% id %}

residue -> amino_acid:? integer amino_acid:+ {% residue %}
         | not amino_acid:? integer amino_acid:+ {% residuenot %}
         | amino_acid:? integer l_par not amino_acid:+ r_par {% residueinvert %}

excludestatement -> exclude residue {% d => ({op: d[0], cond: d[1]}) %}

selectstatement -> select selectstatement2 {% d => ({op: d[0], ...d[1]}) %}

selectstatement2 -> exactly integer from l_par selectlist r_par {% d => ({cond: {op: d[0], num: d[1]}, from: d[4]}) %}
                  | atleast integer from l_par selectlist r_par {% d => ({cond: {op: d[0], num: d[1]}, from: d[4]}) %}
                  | notmorethan integer from l_par selectlist r_par {% d => ({cond: {op: d[0], num: d[1]}, from: d[4]}) %}
                  | atleast integer logicsymbol notmorethan integer from l_par selectlist r_par {% d => ({
                    cond: {
                      op: d[2],
                      conds: [
                        {op: d[0], num: d[1]},
                        {op: d[3], num: d[4]}
                      ]
                    },
                    from: d[7]
                  }) %}

selectlist -> residue listitems:* {% d => [d[0], ...d[1]] %}

listitems -> comma residue {% d => d[1] %}

scorecondition -> score from l_par scorelist r_par {% d => ({op: d[0], scores: d[3]}) %}

scorelist -> scoreitem scoreitems:* {% d => [d[0], ...d[1]] %}

scoreitem -> booleancondition mapper number {% d => ({op: 'MAP', cond: d[0], score: d[2]}) %}
           | max l_par scorelist r_par {% d => ({op: 'MAX_MAP', scores: d[2]}) %}

scoreitems -> comma scoreitem {% d => d[1] %}
                       
number -> minus:? posnumber {% d => d[0] ? -d[1] : d[1] %}
posnumber -> integer {% id %} | float {% id %}


# These are character sets and regular expressions used in the definition of
# tokens. 
# Note: Helpers can not be used in productions

### HELPERS ###

digit -> [0-9] {% id %}


# These are token definitions. The entire grammar is made up of these
# expressions.  Every base production (meaning the production does not depend
# on any other production) will consist entirely of tokens, all other
# production will consist of productions and tokens.             

### TOKENS ###

minus       -> _ "-" {% d => d[1] %}
and         -> _ "AND" {% d => d[1] %}
or          -> _ "OR" {% d => d[1] %}
not         -> _ "NOT" {% d => d[1] %}
exclude     -> _ "EXCLUDE" {% d => d[1] %}
select      -> _ "SELECT" {% d => d[1] %}
from        -> _ "FROM" {% d => d[1] %}
atleast     -> _ "ATLEAST" {% d => d[1] %}
exactly     -> _ "EXACTLY" {% d => d[1] %}
notmorethan -> _ "NOTMORETHAN" {% d => d[1] %}
score       -> _ "SCORE" {% d => d[1] %}
max         -> _ "MAX" {% d => d[1] %}

l_par       -> _ "(" {% d => d[1] %}
r_par       -> _ ")" {% d => d[1] %}
mapper      -> _ "=>" {% d => d[1] %}
comma       -> _ "," {% d => d[1] %}

integer     -> _ digit:+ {% d => Number.parseInt(d[1].join('')) %}
float       -> _ digit:+ "." digit:+ {% d => Number.parseFloat(d[1].join('') + '.' + d[3].join('')) %}
amino_acid  -> _ [ACDEFGHIKLMNPQRSTVWYZdi] {% d => d[1] %}

_ -> [ \t\n\r]:* {% id %}
wschar -> [ \t\n\r] {% id %}

@{%

function booleancondition(d) {
  return {op: d[1], leftCond: d[0], rightCond: d[2]};
}

function residue(d) {
  return {op: 'RESIDUE_MATCH', ref: d[0], pos: d[1], aas: d[2].join('')};
}

function residuenot(d) {
  return {op: 'RESIDUE_NOT', ref: d[1], pos: d[2], aas: d[3].join('')};
}

function residueinvert(d) {
  return {op: 'RESIDUE_INVERT', ref: d[0], pos: d[1], aas: d[3].join('')};
}

%}
