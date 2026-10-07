import React from 'react';
import { Trash2, Check, MessageSquare } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { TaskModalHeader } from './components/TaskModalHeader';
import { TaskStatusAndDates } from './components/TaskStatusAndDates';
import { TaskMembersAndClients } from './components/TaskMembersAndClients';
import { TaskDescriptionSection } from './components/TaskDescriptionSection';
import { TaskReferenceImagesSection } from './components/TaskReferenceImagesSection';
import { TaskChecklistSection } from './components/TaskChecklistSection';
import { TaskCommentsSection } from './components/TaskCommentsSection';
import { TaskDriveAttachmentsTab } from './components/TaskDriveAttachmentsTab';
import { TaskActivityTimelineTab } from './components/TaskActivityTimelineTab';
import { TaskLightboxModal } from './components/TaskLightboxModal';
import { useTaskModalForm } from './hooks/useTaskModalForm';
import { useTaskDriveFiles } from './hooks/useTaskDriveFiles';

export const TaskModal: React.FC = () => {
  const {
    isNewTaskModalOpen,
    setIsNewTaskModalOpen,
    editingTask,
    setEditingTask,
    addTask,
    updateTask,
    deleteTask,
    moveTaskStatus,
    projects,
    employees,
    currentSprint,
    spineStatuses,
    addToast,
    currentUser,
  } = useApp();

  const isOpen = isNewTaskModalOpen || editingTask !== null;
  const [activeBottomTab, setActiveBottomTab] = React.useState<'comments' | 'checklists' | 'attachments' | 'references' | 'history'>('comments');

  const {
    activeDrawerTab,
    setActiveDrawerTab,
    loadingActions,
    formData,
    setFormData,
    comments,
    setComments,
    loadingComments,
    newCommentText,
    setNewCommentText,
    isPostingComment,
    checklists,
    setChecklists,
    handleAddChecklistItem,
    handleToggleChecklistItem,
    handleDeleteChecklistItem,
    attachments,
    setAttachments,
    loadingAttachments,
    isEditingDescription,
    setIsEditingDescription,
    currentDriveFolderId,
    setCurrentDriveFolderId,
    currentDriveFolderUrl,
    setCurrentDriveFolderUrl,
    referenceImages,
    isUploadingReference,
    uploadingReferenceName,
    previewingReference,
    setPreviewingReference,
    copiedLink,
    selectedLabels,
    setSelectedLabels,
    taskMembers,
    timelineActions,
    handleShareTask,
    handleCopyTaskLink,
    handleClose,
    handleAddMember,
    handleMemberClick,
    handleRemoveMember,
    handleToggleLabel,
    handleAddComment,
    handleDeleteComment,
    handleUploadReferenceImage,
    handleDeleteReferenceImage,
    handleSubmit,
    handleStatusChange,
  } = useTaskModalForm({
    isOpen,
    editingTask,
    setEditingTask,
    employees,
    projects,
    currentSprint,
    spineStatuses,
    currentUser,
    addTask,
    updateTask,
    moveTaskStatus,
    setIsNewTaskModalOpen,
    addToast,
  });

  const {
    selectedAttachmentFiles,
    setSelectedAttachmentFiles,
    isPostingAttachment,
    uploadTotalCount,
    uploadProgressCount,
    openingDriveFolder,
    deletingFileIds,
    openAttachmentMenuId,
    setOpenAttachmentMenuId,
    handleUploadSelectedFileAttachment,
    handleOpenDeliveredFolder,
    handleDownloadSingleFile,
    handleRenameAttachment,
    handleToggleCoverImage,
    handleDeleteAttachment,
  } = useTaskDriveFiles({
    editingTask,
    currentDriveFolderId,
    setCurrentDriveFolderId,
    currentDriveFolderUrl,
    setCurrentDriveFolderUrl,
    attachments,
    setAttachments,
    updateTask,
    setEditingTask,
    addToast,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 cursor-pointer"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-2xl lg:max-w-4xl xl:max-w-6xl h-[calc(100vh-2rem)] sm:h-auto sm:max-h-[95vh] sm:min-h-[600px] bg-[#141414] text-white rounded-t-[32px] sm:rounded-2xl shadow-2xl border-t sm:border border-[#262626] overflow-hidden flex flex-col z-10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 ease-out">
        {/* Mobile Drag Handle Indicator */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden shrink-0 bg-[#141414]">
          <div className="w-12 h-1.5 bg-white/15 rounded-full" />
        </div>

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
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#141414] flex flex-col">
            
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
                  className="w-full p-3 bg-[#1C1C1C] border border-[#262626] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#E4007E]/50 focus:ring-2 focus:ring-[#E4007E]/30 transition-all text-white placeholder-slate-400"
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
                      className={`py-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                        activeBottomTab === tab.id
                          ? 'border-[#E4007E] text-transparent bg-clip-text bg-gradient-to-r from-[#E4007E] to-[#E94E18] font-semibold'
                          : 'border-transparent text-slate-400 hover:text-white'
                      }`}
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
                      selectedAttachmentFiles={selectedAttachmentFiles}
                      setSelectedAttachmentFiles={setSelectedAttachmentFiles}
                      setActiveBottomTab={setActiveBottomTab}
                      setNewCommentText={setNewCommentText}
                      onPreview={setPreviewingReference}
                      addToast={addToast}
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
                      editingTask={editingTask!}
                      timelineActions={timelineActions}
                      loadingActions={loadingActions}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="relative w-full md:w-[340px] lg:w-[380px] bg-[#1A1A1A] shadow-[-12px_0_40px_-12px_rgba(0,0,0,0.8)] shrink-0 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto flex flex-col p-4 sm:p-6 custom-scrollbar">
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
              
               

              <TaskStatusAndDates
                formData={formData}
                setFormData={setFormData}
                spineStatuses={spineStatuses}
                onStatusChange={handleStatusChange}
              />
            </div>

            <div className="mt-8 md:mt-auto pt-6 flex gap-2">
              {editingTask && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Tem certeza que deseja excluir a tarefa "${formData.title}"?`)) {
                      deleteTask(editingTask.id);
                      handleClose();
                    }
                  }}
                  className="w-12 sm:w-14 shrink-0 flex justify-center items-center bg-[#1C1C1C] hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 border border-[#262626] hover:border-rose-500/40 rounded-xl transition-all shadow-sm active:scale-95"
                  title="Excluir Tarefa"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-3.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(228,0,126,0.2)] hover:shadow-[0_0_25px_rgba(228,0,126,0.4)] active:scale-95 flex justify-center items-center gap-2"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                Salvar Alterações
              </button>
            </div>
            </div>
          </div>
        </form>
      </div>

      <TaskLightboxModal
        previewingReference={previewingReference}
        onClose={() => setPreviewingReference(null)}
      />
    </div>
  );
};
