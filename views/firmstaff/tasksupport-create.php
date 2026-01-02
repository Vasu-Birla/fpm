<!-- Header Start -->
    <?php include('header.php'); ?>
<!-- Header End -->

<!-- Sidebar Start -->
    <?php include('sidebar.php'); ?>
<!-- Sidebar End -->

<!-- ========================
    Start Page Content
========================= -->
<div class="page-wrapper">
    <div class="content">

      <!-- Page Header -->
      <div class="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-bottom">
          <div class="flex-grow-1">
              <h5 class="fw-bold mb-0">
                  <a href="tasksupport-list.php" class="text-dark"> 
                      <i class="ti ti-chevron-left me-1"></i>Add Task Support
                  </a>
              </h5>
          </div>
      </div>

      <form action="#" method="POST" enctype="multipart/form-data" class="card p-4 shadow-sm border-0">
          <div class="row g-3">

            <div class="col-md-6">
              <label for="assigned_by" class="form-label">Assigned By</label>
              <input type="text" id="assigned_by" name="assigned_by" class="form-control" placeholder="Name" required>
            </div>

            <div class="col-md-6">
              <label for="task_title" class="form-label">Task Title</label>
              <input type="text" id="task_title" name="task_title" class="form-control" placeholder="Short title" required>
            </div>

            <div class="col-md-12">
              <label for="description" class="form-label">Description</label>
              <textarea id="description" name="description" class="form-control" rows="3" required></textarea>
            </div>

            <div class="col-md-4">
              <label for="due_date" class="form-label">Due Date</label>
              <input type="date" id="due_date" name="due_date" class="form-control" required>
            </div>

            <div class="col-md-4">
              <label for="statuss" class="form-label">Status</label>
              <select id="statuss" name="statuss" class="form-select select2" required>
                <option value="">Select Status</option>
                <option value="Pending">Pending</option>
                <option value="Done">Done</option>
              </select>
            </div>

            <div class="col-md-4">
              <label for="task_file" class="form-label">File Upload (optional)</label>
              <input type="file" id="task_file" name="task_file" class="form-control">
            </div>

            <div class="col-md-12">
              <label for="notes" class="form-label">Notes (optional)</label>
              <textarea id="notes" name="notes" class="form-control" rows="2"></textarea>
            </div>

          </div>

          <div class="text-end mt-4">
            <a href="tasksupport-list.php" class="btn btn-light me-2">Cancel</a>
            <button type="submit" class="btn btn-primary">Create Task</button>
          </div>
      </form>

  </div>
</div>
<!-- ========================
    End Page Content
========================= -->

<!-- Footer Start -->
    <?php include('footer.php'); ?>
<!-- Footer End -->
