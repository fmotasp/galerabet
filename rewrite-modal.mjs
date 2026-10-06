import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/TaskModal.tsx', 'utf8');

// Inject new state
content = content.replace(
  '  const isOpen = isNewTaskModalOpen || editingTask !== null;',
  "  const isOpen = isNewTaskModalOpen || editingTask !== null;\n  const [activeBottomTab, setActiveBottomTab] = React.useState<'comments' | 'checklists' | 'attachments' | 'references' | 'history'>('comments');"
);

// We need to replace the return statement completely.
const startIdx = content.indexOf('  return (');
const endIdx = content.lastIndexOf('  );\n};');

const newReturn = `  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 cursor-pointer"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-2xl lg:max-w-4xl xl:max-w-6xl h-full bg-[#101010] text-white shadow-2xl border-l border-[#2E2E2E] overflow-hidden flex flex-col z-10 animate-in slide-in-from-right duration-300 ease-out">
        <TaskModalHeader
          editingTask={editingTask}
          formData={formData}
          setFormData={setFormData}
          spineStatuses={spineStatuses}
          attachments={attachments}
          timelineActions={timelineActions}
          activeDrawerTab={activeDrawerTab}
          setActiveDrawerTab={setActiveDrawerTab}
          copiedLink={copiedLink}
          handleShareTask={handleShareTask}
          handleClose={handleClose}
        />

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Column */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:border-r border-[#2E2E2E] bg-[#101010] flex flex-col">
            
            {!editingTask && (
              <div className="w-full mb-6">
                <label className="block text-xs font-medium text-slate-200 mb-1.5">
                  Título da Tarefa <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-task-title"
                  type="text"
                  required
                  placeholder="Ex: Criar arte da Santa Ceia"
                  value={formData.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setFormData((prev) => ({ ...prev, title: newTitle }));
                  }}
                  className="w-full p-3 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#E4007E] transition-all text-white placeholder-slate-400"
                />
              </div>
            )}

            <TaskDescriptionSection
              description={formData.description}
              onChange={(val) => setFormData((prev) => ({ ...prev, description: val }))}
              isEditingDescription={isEditingDescription}
              setIsEditingDescription={setIsEditingDescription}
            />

            {editingTask && (
              <div className="mt-8">
                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-[#262626] -mb-[1px] text-xs font-bold overflow-x-auto pb-0 shrink-0 custom-scrollbar">
                  {[
                    { id: 'comments', label: 'Comentários', count: comments.length },
                    { id: 'checklists', label: 'Subetapas', count: checklists.length },
                    { id: 'attachments', label: 'Entrega', count: attachments.length },
                    { id: 'references', label: 'Referências', count: referenceImages.length },
                    { id: 'history', label: 'Histórico', count: timelineActions.length },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveBottomTab(tab.id as any)}
                      className={\`py-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap \${
                        activeBottomTab === tab.id
                          ? 'border-[#E4007E] text-transparent bg-clip-text bg-gradient-to-r from-[#E4007E] to-[#E94E18] font-semibold'
                          : 'border-transparent text-slate-400 hover:text-white'
                      }\`}
                    >
                      <span>{tab.label}</span>
                      <span className="text-slate-500 font-medium">({tab.count})</span>
                    </button>
                  ))}
                </div>

                <div className="pt-6 pb-12">
                  {activeBottomTab === 'comments' && (
                    <TaskCommentsSection
                      comments={comments}
                      newCommentText={newCommentText}
                      setNewCommentText={setNewCommentText}
                      isPostingComment={isPostingComment}
                      onAddComment={handleAddComment}
                      onDeleteComment={handleDeleteComment}
                      currentUser={currentUser}
                    />
                  )}
                  {activeBottomTab === 'checklists' && (
                    <TaskChecklistSection
                      checklists={checklists}
                      onAddChecklistItem={handleAddChecklistItem}
                      onToggleChecklistItem={handleToggleChecklistItem}
                      onDeleteChecklistItem={handleDeleteChecklistItem}
                    />
                  )}
                  {activeBottomTab === 'attachments' && (
                    <TaskDriveAttachmentsTab
                      attachments={attachments}
                      loadingAttachments={loadingAttachments}
                      isPostingAttachment={isPostingAttachment}
                      uploadTotalCount={uploadTotalCount}
                      uploadProgressCount={uploadProgressCount}
                      openingDriveFolder={openingDriveFolder}
                      deletingFileIds={deletingFileIds}
                      openAttachmentMenuId={openAttachmentMenuId}
                      setOpenAttachmentMenuId={setOpenAttachmentMenuId}
                      handleUploadSelectedFileAttachment={handleUploadSelectedFileAttachment}
                      handleOpenDeliveredFolder={handleOpenDeliveredFolder}
                      handleDownloadSingleFile={handleDownloadSingleFile}
                      handleRenameAttachment={handleRenameAttachment}
                      handleToggleCoverImage={handleToggleCoverImage}
                      handleDeleteAttachment={handleDeleteAttachment}
                      editingTask={editingTask}
                    />
                  )}
                  {activeBottomTab === 'references' && (
                    <TaskReferenceImagesSection
                      referenceImages={referenceImages}
                      isUploadingReference={isUploadingReference}
                      uploadingReferenceName={uploadingReferenceName}
                      deletingFileIds={deletingFileIds}
                      driveFolderId={editingTask?.driveFolderId}
                      driveFolderUrl={editingTask?.driveFolderUrl}
                      onFileUpload={handleUploadReferenceImage}
                      onDeleteReference={handleDeleteReferenceImage}
                      onPreview={setPreviewingReference}
                    />
                  )}
                  {activeBottomTab === 'history' && (
                    <TaskActivityTimelineTab
                      timelineActions={timelineActions}
                      loadingActions={loadingActions}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="w-full md:w-[340px] lg:w-[380px] bg-[#141414] overflow-y-auto flex flex-col p-4 sm:p-6 shrink-0 relative z-20">
            <h4 className="text-[11px] font-bold text-slate-500 tracking-widest uppercase mb-6">Detalhes</h4>
            
            <div className="space-y-6">
              <TaskMembersAndClients
                taskMembers={taskMembers}
                employees={employees}
                projects={projects}
                selectedLabels={selectedLabels}
                handleAddMember={handleAddMember}
                handleRemoveMember={handleRemoveMember}
                handleToggleLabel={handleToggleLabel}
              />
              
              <div className="w-full h-px bg-[#262626]" />

              <TaskStatusAndDates
                formData={formData}
                setFormData={setFormData}
                spineStatuses={spineStatuses}
                onStatusChange={handleStatusChange}
              />
            </div>

            <div className="mt-8 md:mt-auto pt-6 border-t border-[#262626]">
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(228,0,126,0.2)] hover:shadow-[0_0_25px_rgba(228,0,126,0.4)] active:scale-95 flex justify-center items-center gap-2"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                Salvar Alterações
              </button>
            </div>
          </div>
        </form>
      </div>

      <TaskLightboxModal
        previewingReference={previewingReference}
        onClose={() => setPreviewingReference(null)}
      />
    </div>`;

if (startIdx !== -1 && endIdx !== -1) {
  content = content.slice(0, startIdx) + newReturn + '\n  );\n};\n';
  fs.writeFileSync('src/components/modals/task/TaskModal.tsx', content);
}
