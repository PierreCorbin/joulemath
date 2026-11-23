// Content dates for pages. A page's "updated" date is the last git commit that touched the files that render its words
// and its dated, hand-read data (prices, specs, snapshots). It is never the build time: the daily rebuild only refreshes
// live network numbers (hashprice, difficulty, BTC price), and those carry their own "computed at" time on the page.
import {execFileSync} from 'child_process';
const git=args=>{try{return execFileSync('git',args,{encoding:'utf8'}).trim();}catch(e){return '';}};
export const gitDate=files=>git(['log','-1','--format=%cs','--',...files])||git(['log','-1','--format=%cs']);
export const fmtDay=d=>new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'});
export const stamp=d=>`Page updated <time datetime="${d}">${fmtDay(d)}</time>`;
