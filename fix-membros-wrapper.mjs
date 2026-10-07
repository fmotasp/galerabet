import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', 'utf8');

// I will extract the popover code and the closing tags.
// The structure is currently:
/*
          {/* Add Member Button with Popover * /
          <div className="flex flex-col gap-1.5 items-center">
            <div className="relative flex shrink-0">
              <button ... />
              {isMembersPopoverOpen && ( ... )}
            </div>
          </div>
*/

// It should be:
/*
          {/* Add Member Button * /
          <div className="flex flex-col gap-1.5 items-center">
            <div className="relative flex shrink-0">
              <button ... />
            </div>
          </div>
        </div>
        
        {isMembersPopoverOpen && ( ... )}
*/

// Let's do a precise string replacement.

const oldBlock = `          {/* Add Member Button with Popover */}
          <div className="flex flex-col gap-1.5 items-center">
            <div className="relative flex shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsMembersPopoverOpen(!isMembersPopoverOpen);
                  setIsLabelsPopoverOpen(false);
                }}
                className="w-9 h-9 rounded-full bg-[#1C1C1C] hover:bg-[#E4007E]/20 flex items-center justify-center text-slate-400 hover:text-[#E4007E] transition-all hover:scale-105 active:scale-95 cursor-pointer border-transparent"
                title="Adicionar Membro"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Members Popover Dropdown */}
            {isMembersPopoverOpen && (`;

const newBlock = `          {/* Add Member Button */}
          <div className="flex flex-col gap-1.5 items-center">
            <div className="relative flex shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsMembersPopoverOpen(!isMembersPopoverOpen);
                  setIsLabelsPopoverOpen(false);
                }}
                className="w-9 h-9 rounded-full bg-[#1C1C1C] hover:bg-[#E4007E]/20 flex items-center justify-center text-slate-400 hover:text-[#E4007E] transition-all hover:scale-105 active:scale-95 cursor-pointer border-transparent"
                title="Adicionar Membro"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* Members Popover Dropdown */}
        {isMembersPopoverOpen && (`;

content = content.replace(oldBlock, newBlock);

// Now I need to remove the extra closing tags that were at the end of the Members Popover Dropdown.
// The old structure had:
/*
                </div>
              </>
            )}
          </div>
        </div>
      </div>
*/
// It should now just be:
/*
                </div>
              </>
            )}
      </div>
*/
// Let's find this specific block around line 215.

const endBlock = `                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Clientes */}`;

const newEndBlock = `                    </div>
                  </div>
                </div>
              </>
            )}
      </div>

      {/* Clientes */}`;

content = content.replace(endBlock, newEndBlock);

fs.writeFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', content);

