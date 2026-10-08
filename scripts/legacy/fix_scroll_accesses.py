import re

with open('src/components/accesses/AccessesView.tsx', 'r') as f:
    content = f.read()

# Make the wrapper scrollable
old_wrapper = """      {/* List View */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden text-slate-800 font-sans flex-1 mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ minWidth: '800px' }}>"""

new_wrapper = """      {/* List View */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 text-slate-800 font-sans flex-1 mb-6 overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse" style={{ minWidth: '800px' }}>
            <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">"""

# We need to replace the old thead too:
# old_thead = """            <thead>
#              <tr className="border-b border-slate-200 text-slate-600 font-medium text-sm">"""
# new_thead = """            <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
#              <tr className="border-b border-slate-200 text-slate-600 font-medium text-sm">"""

# So let's just do a string replacement on the thead part too
content = content.replace(
    """<div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ minWidth: '800px' }}>
            <thead>""",
    """<div className="overflow-x-auto overflow-y-auto flex-1 h-[0px]">
          <table className="w-full text-left border-collapse" style={{ minWidth: '800px' }}>
            <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">"""
)

content = content.replace(
    """<div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden text-slate-800 font-sans flex-1 mb-6">""",
    """<div className="bg-white rounded-lg shadow-sm border border-slate-200 text-slate-800 font-sans flex-1 mb-6 overflow-hidden flex flex-col">"""
)

with open('src/components/accesses/AccessesView.tsx', 'w') as f:
    f.write(content)

print("Scroll fixed")
