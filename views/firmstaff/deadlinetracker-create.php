<!-- Header Start -->
    <?php include('header.php'); ?>
<!-- Header End -->

<!-- Sidebar Start -->
    <?php include('sidebar.php'); ?>
<!-- Sidebar End -->

<!-- Main Content -->
<div class="page-wrapper">
  <div class="content container-fluid">

    <!-- Page Header -->
    <div class="page-header">
      <div class="row align-items-center">
        <div class="col">
          <div class="mb-4">
            <h5 class="fw-bold mb-0 d-flex align-items-center">
              <a href="deadlinetracker-list.php" class="text-dark">
                <i class="ti ti-chevron-left me-1"></i>Add Deadline Tracker
              </a>
            </h5>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Card -->
    <div class="card">
      <div class="card-body">
        <form action="deadline-save.php" method="POST">
          <div class="row">

            <!-- Matter ID -->
            <div class="col-md-6 mb-3">
              <label for="matter_id" class="form-label">Matter ID <span class="text-danger">*</span></label>
              <select name="matter_id" id="matter_id" class="form-select" required>
                <option value="">Select Matter</option>
                <option value="MAT-001">MAT-001</option>
                <option value="MAT-002">MAT-002</option>
                <option value="MAT-003">MAT-003</option>
              </select>
            </div>

            <!-- Task Description -->
            <div class="col-md-6 mb-3">
              <label for="task_description" class="form-label">Task Description <span class="text-danger">*</span></label>
              <input type="text" name="task_description" id="task_description" class="form-control" placeholder="Enter Task Description" required>
            </div>

            <!-- Deadline Date -->
            <div class="col-md-6 mb-3">
              <label for="deadline_date" class="form-label">Deadline Date <span class="text-danger">*</span></label>
              <input type="date" name="deadline_date" id="deadline_date" class="form-control" required>
            </div>

            <!-- Responsible -->
            <div class="col-md-6 mb-3">
              <label for="responsible" class="form-label">Responsible <span class="text-danger">*</span></label>
              <select name="responsible" id="responsible" class="form-select" required>
                <option value="">Select Role</option>
                <option value="Lawyer">Lawyer</option>
                <option value="Paralegal">Paralegal</option>
              </select>
            </div>

            <!-- Priority -->
            <div class="col-md-6 mb-3">
              <label for="priority" class="form-label">Priority</label>
              <select name="priority" id="priority" class="form-select">
                <option value="Normal">Normal</option>
                <option value="Low">Low</option>
                <option value="High">High</option>
              </select>
            </div>

            <!-- Alert Via -->
            <div class="col-md-6 mb-3">
              <label class="form-label">Alert Via</label>
              <div class="d-flex align-items-center">
                <div class="form-check me-3">
                  <input class="form-check-input" type="radio" name="alert_via" id="alertEmail" value="Email" checked>
                  <label class="form-check-label" for="alertEmail">Email</label>
                </div>
                <div class="form-check me-3">
                  <input class="form-check-input" type="radio" name="alert_via" id="alertSMS" value="SMS">
                  <label class="form-check-label" for="alertSMS">SMS</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="alert_via" id="alertBoth" value="Both">
                  <label class="form-check-label" for="alertBoth">Both</label>
                </div>
              </div>
            </div>

          </div>

          <!-- Submit Buttons -->
          <div class="text-end mt-4">
            <a href="deadlinetracker-list.php" class="btn btn-light me-2">Cancel</a>
            <button type="submit" class="btn btn-primary">Save Deadline</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</div>
<!-- /Main Content -->

<!-- Footer Start -->
    <?php include('footer.php'); ?>
<!-- Footer End -->
